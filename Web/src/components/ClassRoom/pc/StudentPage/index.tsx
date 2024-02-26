import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useContext,
  Fragment,
  useCallback,
} from 'react';
import {
  ClassroomModeEnum,
  ClassroomStatusEnum,
  SourceType,
  CustomMessageTypes,
} from '../../types';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import { ClassContext } from '../../ClassContext';
import useClassroomStore from '../../store';
import { checkSystemRequirements } from '../../utils/common';
import livePush from '../../utils/LivePush';
import RoomAside, { AsidePlayerTypes } from '../Aside';
import StudentBottom from '../Bottom/StudentBottom';
import H5Player from '../../mobile/H5Player';
import AsidePlayer from '../../components/PCAsidePlayer';
import RoomInteractionList from '../InteractionList';
import NeteaseBoard from '../../components/Whiteboard/NeteaseBoard';
import PCMainWrap from '../../components/PCMainWrap';
import NotStartedPlaceholder from './NotStartedPlaceholder';
import { usePageVisibilityListener } from '@/utils/hooks';
import styles from '../styles.less';

const CameraTabKey = SourceType.Camera;
const MaterialTabKey = SourceType.Material;

const StudentPage: React.FC = () => {
  const {
    classroomInfo: {
      teacherId,
      mode,
      status,
      linkInfo: teacherLinkInfo,
      shadowLinkInfo, // 不支持 WebRTC 的设备上，只展示一个画面，画面是混流后的布局，数据来源是 shadowLinkInfo
    },
    connectedSpectators,
    interacting,
    supportWebRTC,
    setSupportWebRTC,
  } = useClassroomStore(state => state);

  const { whiteBoardHidden, auiMessage, userInfo } = useContext(ClassContext);

  const [mainScreenKey, setMainScreenKey] = useState(MaterialTabKey);
  const [subScreenKey, setSubScreenKey] = useState(CameraTabKey);
  const [rtsFallback, setRtsFallback] = useState(false);
  const multiScreen = useMemo(
    () => supportWebRTC && !rtsFallback,
    [supportWebRTC, rtsFallback]
  );

  useEffect(() => {
    const check = async () => {
      const result = await checkSystemRequirements();
      setSupportWebRTC(result.support);
    };
    if (supportWebRTC === undefined) {
      check();
    }
  }, [supportWebRTC]);

  // 学生端专注度检测
  usePageVisibilityListener({
    onVisible: () => {
      console.log('页面可见，上报专注度事件建议在这里执行');
    },
    onHidden: () => {
      console.log('页面不可见，上报专注度事件建议在这里执行');
    },
  });

  useEffect(() => {
    if (status === ClassroomStatusEnum.ended) {
      // 结束后将主播放器内容重置为 Material
      setMainScreenKey(MaterialTabKey);
      setSubScreenKey(CameraTabKey);
    }
  }, [status]);

  const asidePlayerType = useMemo(() => {
    if (mode === ClassroomModeEnum.Big) {
      return AsidePlayerTypes.custom;
    }
    return AsidePlayerTypes.none;
  }, [mode]);

  const handleRtsFallback = () => {
    setRtsFallback(true);
  };

  const toggleView = () => {
    // 切换主播放器、侧边栏播放器加载的流
    setMainScreenKey(
      mainScreenKey === MaterialTabKey ? CameraTabKey : MaterialTabKey
    );
    setSubScreenKey(
      subScreenKey === MaterialTabKey ? CameraTabKey : MaterialTabKey
    );
  };

  const teacherInteractionInfo = useMemo(
    () => connectedSpectators.find(({ userId }) => userId === teacherId),
    [connectedSpectators, teacherId]
  );

  const [micOpened, setMicOpened] = useState<boolean>(false);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [whiteBoardActivated, setWhiteBoardActivated] = useState(
    !whiteBoardHidden
  );

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
    if (!whiteBoardHidden) {
      setWhiteBoardActivated(
        !teacherPubStatus.mutilMedia && !teacherPubStatus.screenShare
      );
    }

    setHasMainScreenSource(
      mainScreenKey === MaterialTabKey ? hasMaterial : hasCamera
    );
    setHasSubScreenSource(
      subScreenKey === MaterialTabKey ? hasMaterial : hasCamera
    );
  }, [teacherInteractionInfo, mainScreenKey, subScreenKey, whiteBoardHidden]);

  const player = useMemo(() => {
    return livePush.createPlayerInstance();
  }, []);

  const teacherInteractingCamera = useRef<HTMLVideoElement | null>(null);
  const teacherInteractingScreen = useRef<HTMLVideoElement | null>(null);
  const [teacherInteractingCameraPulling, setTeacherInteractingCameraPulling] =
    useState(false); // 播放器for老师摄像头是否正在连麦拉流
  const [teacherInteractingScreenPulling, setTeacherInteractingScreenPulling] =
    useState(false); // 播放器for老师本地流/屏幕流是否正在连麦拉流

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
          setRtsFallback(false);
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
    if (whiteBoardHidden) return;

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
  }, [auiMessage, handleReceivedMessage, whiteBoardHidden]);

  const bigClassLiveUrlsForWebRTCSupported = useMemo(() => {
    return {
      [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]:
        (connectedSpectators.length > 1 ? shadowLinkInfo : teacherLinkInfo)
          ?.cdnPullInfo ?? {},
    };
    // 使用 connectedSpectators.length 判断，减少不必要的更新
  }, [teacherLinkInfo, shadowLinkInfo, connectedSpectators.length]);
  // const bigClassLiveUrlsForWebRTCSupported = useMemo(() => {
  //   return {
  //     [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
  //     [SourceType.Camera]: shadowLinkInfo?.cdnPullInfo ?? {},
  //   };
  // }, [teacherLinkInfo, shadowLinkInfo]);

  const bigClassLiveUrlsForWebRTCNotSupported = useMemo(() => {
    return {
      [SourceType.Material]: shadowLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]: teacherLinkInfo?.cdnPullInfo ?? {},
    };
  }, [teacherLinkInfo, shadowLinkInfo]);

  const openClassLiveUrls = useMemo(
    () => ({ [SourceType.Camera]: teacherLinkInfo?.cdnPullInfo ?? {} }),
    [teacherLinkInfo]
  );

  const asidePlayer = useMemo(() => {
    // 非公开课需要展示侧边栏
    if (mode !== ClassroomModeEnum.Open) {
      if (!multiScreen) {
        return undefined;
      }

      return (
        <AsidePlayer
          micOpened={micOpened}
          switcherVisible={whiteBoardHidden && !interacting}
          onSwitchView={toggleView}
        >
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
              cdnUrlMap={bigClassLiveUrlsForWebRTCSupported}
              sourceType={
                subScreenKey === MaterialTabKey
                  ? SourceType.Material
                  : SourceType.Camera
              }
              rtsFirst
              noSource={!hasSubScreenSource}
              mute={subScreenKey !== CameraTabKey && hasCamera}
              statusTextVisible={false}
              controlBarVisibility="never"
            />
          )}
        </AsidePlayer>
      );
    }
    return undefined;
  }, [
    mode,
    multiScreen,
    subScreenKey,
    micOpened,
    interacting,
    whiteBoardHidden,
    hasSubScreenSource,
    bigClassLiveUrlsForWebRTCSupported,
  ]);

  // 渲染公开课模式的内容
  const renderOpenModeContent = () => {
    return (
      <H5Player
        id="mainPlayer"
        device="pc"
        noSource={!teacherInteractionInfo}
        cdnUrlMap={openClassLiveUrls}
        sourceType={SourceType.Camera}
      />
    );
  };

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
    if (multiScreen) {
      return (
        <H5Player
          id="mainPlayer"
          device="pc"
          mute={mainScreenKey !== CameraTabKey && hasCamera}
          noSource={!hasMainScreenSource}
          cdnUrlMap={bigClassLiveUrlsForWebRTCSupported}
          rtsFirst
          sourceType={
            mainScreenKey === MaterialTabKey
              ? SourceType.Material
              : SourceType.Camera
          }
          onRtsFallback={handleRtsFallback}
        />
      );
    }
    return (
      <H5Player
        id="mainPlayer"
        device="pc"
        sourceType={SourceType.Material}
        noSource={!hasMainScreenSource || !hasSubScreenSource}
        cdnUrlMap={bigClassLiveUrlsForWebRTCNotSupported}
        rtsFirst={false}
      />
    );
  };

  // 渲染非公开课模式，目前即大班课的内容
  const renderOtherModeContent = () => (
    <>
      {/* 非指定不集成白板且支持 RTS 时，初始化白板 */}
      {!whiteBoardHidden && multiScreen ? <NeteaseBoard /> : null}
      {/* 当前白板不激活，或 RTS 降级时，渲染播放器 */}
      {!whiteBoardActivated || !multiScreen ? (
        <div className={styles['amaui-classroom__main__content__player']}>
          {renderPurePlayerContent()}
        </div>
      ) : null}
    </>
  );

  return (
    <Fragment>
      <div className="amaui-classroom__body">
        <div className="amaui-classroom__main">
          {interacting ? (
            <RoomInteractionList wrapClassName="amaui-classroom__main__speaker" />
          ) : null}

          <PCMainWrap className="amaui-classroom__main__content">
            {status === ClassroomStatusEnum.started ? (
              mode === ClassroomModeEnum.Open ? (
                renderOpenModeContent()
              ) : (
                renderOtherModeContent()
              )
            ) : (
              <NotStartedPlaceholder />
            )}
          </PCMainWrap>
        </div>

        <RoomAside
          className="amaui-classroom__aside"
          playerType={asidePlayerType}
          customPlayer={asidePlayer}
        />
      </div>
      <StudentBottom />
    </Fragment>
  );
};

export default StudentPage;
