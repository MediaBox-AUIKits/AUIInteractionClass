import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from 'react';
import { Modal } from 'antd';
import useClassroomStore from '../store';
import { checkSystemRequirements } from '../utils/common';
import livePush from '../utils/LivePush';
import AssistantRoomMain from './RoomMain/AssistantRoomMain';
import RoomAside, { AsidePlayerTypes } from './Aside';
import AssistantBottom from './Bottom/AssistantBottom';
import H5Player from '../mobile/H5Player';
import AsidePlayer from '../components/PCAsidePlayer';
import RoomInteractionList from './InteractionList';
import AssistantCooperation from '../components/AssistantCooperation';
import { ClassContext } from '../ClassContext';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import { CustomMessageTypes, ClassroomModeEnum, SourceType } from '../types';
import styles from './styles.less';

const AssistantPage: React.FC = () => {
  const {
    classroomInfo: {
      teacherId,
      mode,
      linkInfo: teacherLinkInfo,
      shadowLinkInfo, // 不支持 WebRTC 的设备上，只展示一个画面，画面是混流后的布局，数据来源是 shadowLinkInfo
    },
    connectedSpectators,
    interacting,
    supportWebRTC,
    setSupportWebRTC,
  } = useClassroomStore(state => state);
  const { auiMessage, userInfo, exit } = useContext(ClassContext);
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    const check = async () => {
      const result = await checkSystemRequirements();
      setSupportWebRTC(result.support);
    };
    if (supportWebRTC === undefined) {
      check();
    }
    if (supportWebRTC === false) {
      modal.warning({
        content:
          '当前浏览器不支持WebRTC，请使用其他浏览器（Chrome≥63、Firefox≥62、Opera≥15、Edge≥79、QQ浏览器[QQ内核]≥63、Safari≥11）进入助教页。',
        okText: '知道了，退出助教页',
        onOk: exit,
      });
    }
  }, [supportWebRTC]);

  const teacherInteractionInfo = useMemo(
    () => connectedSpectators.find(({ userId }) => userId === teacherId),
    [connectedSpectators, teacherId]
  );

  const [whiteBoardActivated, setWhiteBoardActivated] = useState(true);
  const [micOpened, setMicOpened] = useState<boolean>(false);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMainScreenSource, setHasMainScreenSource] =
    useState<boolean>(false);
  const [hasSubScreenSource, setHasSubScreenSource] = useState<boolean>(false);

  useEffect(() => {
    const teacherPubStatus = teacherInteractionInfo ?? {
      isAudioPublishing: false,
      isScreenPublishing: false,
      isVideoPublishing: false,
      micOpened: false,
      screenShare: false,
      mutilMedia: false,
    };
    setMicOpened(!!teacherPubStatus.micOpened);
    const hasCamera = !!teacherPubStatus.isVideoPublishing;
    const hasMaterial = !!teacherPubStatus.isScreenPublishing;
    setHasCamera(hasCamera);
    setHasSubScreenSource(hasCamera);
    setHasMainScreenSource(hasMaterial);
    setWhiteBoardActivated(
      !teacherPubStatus.mutilMedia && !teacherPubStatus.screenShare
    );
  }, [teacherInteractionInfo]);

  // 连麦播放器
  const player = useMemo(() => {
    return livePush.createPlayerInstance();
  }, []);

  const teacherInteractingCamera = useRef<HTMLVideoElement | null>(null);
  const teacherInteractingScreen = useRef<HTMLVideoElement | null>(null);
  const [teacherInteractingCameraPulling, setTeacherInteractingCameraPulling] =
    useState(false); // 播放器for老师摄像头是否正在拉流
  const [teacherInteractingScreenPulling, setTeacherInteractingScreenPulling] =
    useState(false); // 播放器for老师本地流/屏幕流是否正在拉流

  // 连麦时，拉老师摄像头画面
  useEffect(() => {
    if (
      player &&
      teacherInteractionInfo?.rtcPullUrl &&
      !teacherInteractingCameraPulling &&
      teacherInteractingCamera.current
    ) {
      const startPlay = async () => {
        try {
          await player.startPlay(
            teacherInteractionInfo?.rtcPullUrl as string,
            teacherInteractingCamera.current!
          );
          setTeacherInteractingCameraPulling(true);
        } catch (error) {
          console.log(error);
        }
      };
      startPlay();
    }
  }, [
    player,
    teacherInteractingCameraPulling,
    teacherInteractionInfo,
    teacherInteractingCamera.current,
  ]);

  // 连麦时，拉老师屏幕/本地画面流
  useEffect(() => {
    if (
      player &&
      teacherInteractionInfo?.rtcPullUrl &&
      !teacherInteractingScreenPulling &&
      teacherInteractingScreen.current
    ) {
      const startPlay = async () => {
        try {
          await player.startPlay(
            teacherInteractionInfo?.rtcPullUrl as string,
            '',
            teacherInteractingScreen.current!
          );
          setTeacherInteractingScreenPulling(true);
        } catch (error) {
          console.log(error);
        }
      };
      startPlay();
      return;
    }
    if (whiteBoardActivated && teacherInteractingScreenPulling) {
      setTeacherInteractingScreenPulling(false);
    }
  }, [
    player,
    teacherInteractingScreenPulling,
    teacherInteractionInfo,
    whiteBoardActivated,
    teacherInteractingScreen.current,
  ]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.interacting,
      (val, prevVal) => {
        if (!val && prevVal) {
          setTeacherInteractingCameraPulling(false);
          setTeacherInteractingScreenPulling(false);
        }
      }
    );
    return sub;
  }, []);

  useEffect(() => {
    return () => {
      if (player) {
        if (teacherInteractingCamera.current)
          player.stopPlay(teacherInteractingCamera.current);
        if (teacherInteractingScreen.current)
          player.stopPlay(teacherInteractingScreen.current);
      }
    };
  }, [player]);

  const handleReceivedMessage = useCallback(
    (eventData: any) => {
      const { type, senderId } = eventData || {};
      switch (type) {
        case CustomMessageTypes.WhiteBoardVisible:
          if (senderId === teacherId && senderId !== userInfo?.userId) {
            setWhiteBoardActivated(true);
          }
          break;
        default:
          break;
      }
    },
    [teacherId, userInfo]
  );

  useEffect(() => {
    auiMessage.addListener(
      AUIMessageEvents.onMessageReceived,
      handleReceivedMessage
    );
    return () => {
      auiMessage.removeListener(
        AUIMessageEvents.onMessageReceived,
        handleReceivedMessage
      );
    };
  }, [auiMessage, handleReceivedMessage]);

  const bigClassLiveUrlsForWebRTCSupported = useMemo(() => {
    return {
      [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]:
        (connectedSpectators.length > 1 ? shadowLinkInfo : teacherLinkInfo)
          ?.cdnPullInfo ?? {},
    };
    // 使用 connectedSpectators.length 判断，减少不必要的更新
  }, [teacherLinkInfo, shadowLinkInfo, connectedSpectators.length]);

  const openClassLiveUrls = useMemo(
    () => ({
      [SourceType.Camera]: teacherLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
    }),
    [teacherLinkInfo]
  );

  const asidePlayer = useMemo(
    () => (
      <AsidePlayer micOpened={micOpened} switcherVisible={false}>
        {interacting && teacherInteractionInfo ? (
          <video
            id="interaction-camera"
            ref={teacherInteractingCamera}
            className={styles['amaui-classroom__aside__interacting-video']}
          ></video>
        ) : (
          <H5Player
            id="asidePlayer"
            device="pc"
            cdnUrlMap={
              mode === ClassroomModeEnum.Big
                ? bigClassLiveUrlsForWebRTCSupported
                : openClassLiveUrls
            }
            sourceType={SourceType.Camera}
            rtsFirst
            mute={!hasCamera}
            noSource={!hasSubScreenSource}
            statusTextVisible={false}
            controlBarVisibility="never"
          />
        )}
      </AsidePlayer>
    ),
    [
      mode,
      micOpened,
      interacting,
      hasSubScreenSource,
      bigClassLiveUrlsForWebRTCSupported,
      openClassLiveUrls,
    ]
  );

  const renderPurePlayerContent = () => {
    if (interacting) {
      return (
        <video
          ref={teacherInteractingScreen}
          id="interaction-shareScreen"
          muted
          className={styles['amaui-classroom__aside__interacting-video']}
        ></video>
      );
    }
    return (
      <H5Player
        id="mainPlayer"
        device="pc"
        sourceType={SourceType.Material}
        cdnUrlMap={
          mode === ClassroomModeEnum.Big
            ? bigClassLiveUrlsForWebRTCSupported
            : openClassLiveUrls
        }
        rtsFirst
        mute={hasCamera}
        noSource={!hasMainScreenSource}
      />
    );
  };

  return (
    <>
      <div className="amaui-classroom__body">
        <div className="amaui-classroom__main">
          {interacting ? (
            <RoomInteractionList wrapClassName="amaui-classroom__main__speaker" />
          ) : null}

          <AssistantRoomMain
            wrapClassName="amaui-classroom__main__content"
            whiteBoardActivated={whiteBoardActivated}
          >
            <div className={styles['amaui-classroom__main__content__player']}>
              {renderPurePlayerContent()}
            </div>
          </AssistantRoomMain>
        </div>

        <RoomAside
          className="amaui-classroom__aside"
          playerType={AsidePlayerTypes.custom}
          customPlayer={asidePlayer}
        />
      </div>
      <AssistantBottom whiteBoardActivated={whiteBoardActivated} />
      <AssistantCooperation />
      {contextHolder}
    </>
  );
};

export default AssistantPage;
