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
import PCAsideScreenWrapper from '../../components/PCAsideScreenWrapper';
import NeteaseBoard from '../../components/Whiteboard/NeteaseBoard';
import PCMainWrap from '../../components/PCMainWrap';
import NotStartedPlaceholder from './NotStartedPlaceholder';
import StudentCheckIn from '../../components/CheckInManagement/StudentCheckIn';
import { usePageVisibilityListener } from '@/utils/hooks';
import styles from '../styles.less';

/**
 * 大班课，直播流的内容：
 *
 * 在 classroomInfo.linkInfo 中
 * - StreamName 后缀为 `${teacherId}_camera`：教师摄像头流，单路流；
 * - StreamName 后缀为 `${teacherId}_shareScreen`：教师白板/本地视频插播/屏幕共享流，单路流；
 * 在 classroomInfo.shadowLinkInfo 中
 * - StreamName 后缀为 `${teacherId}_shadow_camera`：
 *   - 未连麦：默认展位图；
 *   - 连麦：连麦成员的摄像头流混流；
 * - StreamName 后缀为 `${teacherId}_shadow_shareScreen`：主次画面混流，即教师摄像头流+白板/本地视频插播/屏幕共享流的合流画面；
 */

const StudentPage: React.FC = () => {
  const {
    classroomInfo: {
      teacherId,
      mode,
      status,
      linkInfo: teacherLinkInfo,
      shadowLinkInfo, // 不支持 WebRTC 的设备上，只展示一个画面，画面是混流后的布局，数据来源是 shadowLinkInfo
    },
    cameraIsSubScreen,
    connectedSpectators,
    interacting,
    supportWebRTC,
    setSupportWebRTC,
  } = useClassroomStore(state => state);

  const { whiteBoardHidden, auiMessage, userInfo } = useContext(ClassContext);
  const [rtsFallback, setRtsFallback] = useState(false);
  // 分主次画面显示（主次画面，老师摄像头 + 老师白板/屏幕共享/本地插播）：非大班课，且支持 WebRTC，且未发生 rts 降级
  const splitScreen = useMemo(
    () => supportWebRTC && !rtsFallback && mode !== ClassroomModeEnum.Open,
    [supportWebRTC, rtsFallback, mode]
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

  const asidePlayerType = useMemo(() => {
    if (mode === ClassroomModeEnum.Big) {
      return AsidePlayerTypes.custom;
    }
    return AsidePlayerTypes.none;
  }, [mode]);

  const handleRtsFallback = () => {
    setRtsFallback(true);
  };

  const teacherInteractionInfo = useMemo(
    () => connectedSpectators.find(({ userId }) => userId === teacherId),
    [connectedSpectators, teacherId]
  );

  const [micOpened, setMicOpened] = useState<boolean>(false);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMaterial, setHasMaterial] = useState<boolean>(false);
  // 白板启用
  const [whiteBoardActivated, setWhiteBoardActivated] = useState(
    !whiteBoardHidden
  );

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
    setHasMaterial(hasMaterial);
    if (!whiteBoardHidden) {
      // 若当前老师正在本地插播/屏幕共享，则不展示白板
      setWhiteBoardActivated(
        !teacherPubStatus.mutilMedia && !teacherPubStatus.screenShare
      );
    }
  }, [teacherInteractionInfo, whiteBoardHidden]);

  const player = useMemo(() => {
    return livePush.createPlayerInstance();
  }, []);

  // 连麦时，老师主流（摄像头）的挂载节点
  const teacherInteractingCamera = useRef<HTMLVideoElement | null>(null);
  // 连麦时，老师辅流（白板/屏幕共享/本地插播）的挂载节点
  const teacherInteractingScreen = useRef<HTMLVideoElement | null>(null);
  // 连麦时，正在拉取老师主流
  const teacherInteractingCameraPullingRef = useRef(false);
  // 连麦时，正在拉取老师辅流
  const teacherInteractingScreenPullingRef = useRef(false);
  // 连麦时，老师主流已拉取
  const [teacherInteractingCameraPulled, setTeacherInteractingCameraPulling] =
    useState(false);
  // 连麦时，老师辅流已拉取
  const [teacherInteractingScreenPulled, setTeacherInteractingScreenPulling] =
    useState(false);

  useEffect(() => {
    return () => {
      if (player) {
        player.stopPlay();
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
    // 隐藏白板，则不需要监听相关消息
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

  const pullTeacherInteractingCamera = useCallback(async () => {
    if (
      player &&
      teacherInteractionInfo?.rtcPullUrl &&
      teacherInteractingCamera.current &&
      !teacherInteractingCameraPulled &&
      !teacherInteractingCameraPullingRef.current
    ) {
      teacherInteractingCameraPullingRef.current = true;
      try {
        await player.startPlay(
          teacherInteractionInfo?.rtcPullUrl as string,
          teacherInteractingCamera.current!
        );
      } catch (error) {
        console.log(error);
      } finally {
        setTeacherInteractingCameraPulling(true);

        teacherInteractingCameraPullingRef.current = false;
      }
    }
  }, [player, teacherInteractionInfo, teacherInteractingCameraPulled]);

  // 若连麦中，主流并未被拉取
  useEffect(() => {
    if (interacting) {
      pullTeacherInteractingCamera();
    }
  }, [interacting, pullTeacherInteractingCamera]);

  const pullTeacherInteractingScreen = useCallback(async () => {
    if (
      player &&
      teacherInteractionInfo?.rtcPullUrl &&
      teacherInteractingScreen.current &&
      !teacherInteractingScreenPulled &&
      !teacherInteractingScreenPullingRef.current
    ) {
      teacherInteractingScreenPullingRef.current = true;
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
      teacherInteractingScreenPullingRef.current = false;
    }
  }, [player, teacherInteractionInfo, teacherInteractingScreenPulled]);

  // 白板激活，则不拉取连麦辅流
  useEffect(() => {
    if (whiteBoardActivated && teacherInteractingScreenPulled) {
      setTeacherInteractingScreenPulling(false);
    }
  }, [whiteBoardActivated, teacherInteractingScreenPulled]);

  // 若连麦中，白板不激活，且主次画面显示，辅流并未被拉取
  useEffect(() => {
    if (
      interacting &&
      !whiteBoardActivated &&
      splitScreen &&
      !teacherInteractingScreenPulled
    ) {
      pullTeacherInteractingScreen();
    }
  }, [
    interacting,
    whiteBoardActivated,
    splitScreen,
    teacherInteractingScreenPulled,
    pullTeacherInteractingScreen,
  ]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.interacting,
      (val, prevVal) => {
        if (!val && prevVal) {
          // 结束连麦，重置连麦拉流状态、RTS 降级标识（可连麦则一定支持 rts 拉流）
          setTeacherInteractingCameraPulling(false);
          setTeacherInteractingScreenPulling(false);
          setRtsFallback(false);
        }
      }
    );
    return sub;
  }, []);

  // 主次画面切换，会导致连麦播放器 Player 失去挂载节点，因此需要重新播放
  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.cameraIsSubScreen,
      (val, prevVal) => {
        if (val !== prevVal) {
          if (teacherInteractingCameraPulled) {
            setTeacherInteractingCameraPulling(false);
          }
          if (teacherInteractingScreenPulled) {
            setTeacherInteractingScreenPulling(false);
          }
          player.stopPlay();
        }
      }
    );
    return sub;
  }, [teacherInteractingCameraPulled, teacherInteractingScreenPulled, player]);

  const teacherCameraStream = useMemo(() => {
    // 连麦时，需要主流（摄像头）挂载节点
    if (interacting && teacherInteractionInfo) {
      return (
        <video
          id="interaction-camera"
          ref={teacherInteractingCamera}
          className={styles['amaui-classroom__aside__interacting-video']}
        />
      );
    }
    // 非连麦时，拉取老师摄像头直播流（rts 优先）
    return (
      <H5Player
        id="asidePlayer"
        device="pc"
        cdnUrlMap={bigClassLiveUrlsForWebRTCSupported}
        sourceType={SourceType.Camera}
        rtsFirst
        noSource={!hasCamera}
        mute={!hasCamera}
        statusTextVisible={false}
        controlBarVisibility="never"
      />
    );
  }, [
    interacting,
    teacherInteractionInfo,
    hasCamera,
    bigClassLiveUrlsForWebRTCSupported,
  ]);

  const teacherMaterialStream = useMemo(() => {
    // 连麦时，需要辅流（白板/屏幕共享/本地插播）挂载节点
    if (interacting && teacherInteractionInfo) {
      return (
        <video
          ref={teacherInteractingScreen}
          id="interaction-shareScreen"
          muted
          className={styles['amaui-classroom__aside__interacting-video']}
        />
      );
    }
    // 分主次画面显示，拉取老师白板/屏幕共享/本地插播流（rts 优先）
    if (splitScreen) {
      return (
        <H5Player
          id="mainPlayer"
          device="pc"
          mute={hasCamera}
          noSource={!hasMaterial}
          cdnUrlMap={bigClassLiveUrlsForWebRTCSupported}
          rtsFirst
          sourceType={SourceType.Material}
          onRtsFallback={handleRtsFallback}
        />
      );
    }
    // 只有一个画面时，展示教师摄像头流+白板/本地视频插播/屏幕共享流的合流画面
    return (
      <H5Player
        id="mainPlayer"
        device="pc"
        sourceType={SourceType.Material}
        noSource={!hasCamera || !hasMaterial}
        cdnUrlMap={bigClassLiveUrlsForWebRTCNotSupported}
        rtsFirst={false}
      />
    );
  }, [
    interacting,
    teacherInteractionInfo,
    splitScreen,
    hasCamera,
    hasMaterial,
    bigClassLiveUrlsForWebRTCSupported,
    bigClassLiveUrlsForWebRTCNotSupported,
  ]);

  const asideScreen = useMemo(() => {
    // 若无分屏，则无侧边栏的次画面
    if (!splitScreen) {
      return undefined;
    }

    // 摄像头为次画面，则展示老师摄像头
    if (cameraIsSubScreen) {
      return (
        <AsidePlayer micOpened={micOpened} switcherVisible>
          {teacherCameraStream}
        </AsidePlayer>
      );
    }

    // 若白板激活，展示白板
    if (whiteBoardActivated)
      return (
        <PCAsideScreenWrapper switcherVisible>
          {/* 学生无白板权限，隐藏控件 */}
          <NeteaseBoard
            wrapClassName="amaui-classroom__aside__sub_screen"
            canControl={false}
            canTurnPage={false}
            canUpdateCourceware={false}
          />
        </PCAsideScreenWrapper>
      );

    // 若白板未激活，则拉取辅流（白板/屏幕共享/本地插播）
    return (
      <AsidePlayer micOpened={micOpened} switcherVisible>
        {teacherMaterialStream}
      </AsidePlayer>
    );
  }, [
    splitScreen,
    micOpened,
    whiteBoardActivated,
    cameraIsSubScreen,
    teacherCameraStream,
    teacherMaterialStream,
  ]);

  // 渲染公开课模式的内容
  const openModeScreen = useMemo(
    () => (
      <H5Player
        id="mainPlayer"
        device="pc"
        noSource={!teacherInteractionInfo}
        cdnUrlMap={openClassLiveUrls}
        sourceType={SourceType.Camera}
      />
    ),
    [teacherInteractionInfo, openClassLiveUrls]
  );

  // 渲染非公开课模式，目前即大班课的内容
  const otherModeMainScreen = useMemo(() => {
    // 摄像头为主画面
    if (!cameraIsSubScreen) return teacherCameraStream;
    // 白板激活，且分屏显示时，初始化白板
    if (splitScreen && whiteBoardActivated) return <NeteaseBoard />;
    // 当前白板不激活，或不分屏，渲染播放器
    if (!whiteBoardActivated || !splitScreen) {
      return (
        <div className={styles['amaui-classroom__main__content__player']}>
          {teacherMaterialStream}
        </div>
      );
    }
  }, [
    cameraIsSubScreen,
    splitScreen,
    whiteBoardActivated,
    teacherCameraStream,
    teacherMaterialStream,
  ]);

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
                openModeScreen
              ) : (
                otherModeMainScreen
              )
            ) : (
              <NotStartedPlaceholder />
            )}
          </PCMainWrap>
        </div>

        <RoomAside
          className="amaui-classroom__aside"
          playerType={asidePlayerType}
          customPlayer={asideScreen}
        />
      </div>
      <StudentBottom />
      <StudentCheckIn />
    </Fragment>
  );
};

export default StudentPage;
