import React, {
  useState,
  useMemo,
  Fragment,
  useCallback,
  useEffect,
  useContext,
} from 'react';
import { ClassContext } from '../ClassContext';
import classNames from 'classnames';
import FrontContent from './FrontContent';
import H5Player from './H5Player';
import H5Tabs, {
  CameraTabKey,
  MaterialTabKey,
  ChatTabKey,
  IntroTabKey,
} from './H5Tabs';
import IntroPanel from './IntroPanel';
import ChatPanel from './ChatPanel';
import ChatControls from './ChatControls';
import Announcement from './Announcement';
import Icon from '@ant-design/icons';
import { SwitchArrowsSvg } from '../components/icons';
import { ClassroomStatusEnum, SourceType, CustomMessageTypes } from '../types';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import useClassroomStore from '../store';
import { supportSafeArea, checkSystemRequirements } from '../utils/common';

import styles from './index.less';

interface BigClassProps {
  onBarVisibleChange: (visible: boolean) => void;
  active: boolean;
}

// 支持 WebRTC 则优先播放 rts 流，两个画面
const defaultTabsForTwoScreens = [CameraTabKey, ChatTabKey, IntroTabKey];
// 不支持 WebRTC 则降级播放 hls/flv 流，单画面
const defaultTabsForSingleScreen = [ChatTabKey, IntroTabKey];

function BigClass(props: BigClassProps) {
  const { onBarVisibleChange, active } = props;
  const {
    supportWebRTC,
    classroomInfo: {
      status,
      teacherId,
      linkInfo: teacherLinkInfo,
      shadowLinkInfo, // 不支持 WebRTC 的设备上，只展示一个画面，画面是混流后的布局，数据来源是 shadowLinkInfo
    },
    connectedSpectators,
    setSupportWebRTC,
  } = useClassroomStore(state => state);

  const { whiteBoardHidden, auiMessage, userInfo } = useContext(ClassContext);

  const isInited = useMemo(() => {
    return status !== ClassroomStatusEnum.no_data;
  }, [status]);
  const interacting = useMemo(
    () => connectedSpectators.length > 1,
    [connectedSpectators]
  );

  const [tabs, setTabs] = useState<string[]>([]);
  const [tabKey, setTabKey] = useState(CameraTabKey);
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

  const hasSafeAreaBottom = useMemo(() => {
    return supportSafeArea('bottom');
  }, []);

  useEffect(() => {
    const _tabs = supportWebRTC
      ? defaultTabsForTwoScreens
      : defaultTabsForSingleScreen;
    setTabs(_tabs);
    setTabKey(_tabs[0]);
  }, [supportWebRTC]);

  const [mainScreenKey, setMainScreenKey] = useState(MaterialTabKey);
  const [subScreenKey, setSubScreenKey] = useState(CameraTabKey);

  const onSwitch = useCallback(() => {
    const newSubScreenKey = mainScreenKey;
    const newMainScreenKey =
      mainScreenKey === CameraTabKey ? MaterialTabKey : CameraTabKey;

    setSubScreenKey(newSubScreenKey);
    setMainScreenKey(newMainScreenKey);

    const _tabs = [...tabs];
    _tabs.splice(0, 1, newSubScreenKey);
    setTabs(_tabs);
  }, [tabs, mainScreenKey, tabKey]);

  useEffect(() => {
    if (tabKey === mainScreenKey) {
      setTabKey(subScreenKey);
    }
  }, [tabKey, mainScreenKey]);

  const [hasCamera, setHasCamera] = useState(false);
  const [whiteBoardActivated, setWhiteBoardActivated] = useState(
    !whiteBoardHidden
  );
  const [hasMainScreenSource, setHasMainScreenSource] = useState(false);
  const [hasSubScreenSource, setHasSubScreenSource] = useState(false);

  const teacherInteractionInfo = useMemo(
    () => connectedSpectators.find(({ userId }) => userId === teacherId),
    [connectedSpectators, teacherId]
  );

  useEffect(() => {
    const teacherPubStatus = teacherInteractionInfo ?? {
      isAudioPublishing: false,
      isScreenPublishing: false,
      isVideoPublishing: false,
      screenShare: false,
      mutilMedia: false,
    };
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
  }, [
    teacherInteractionInfo,
    teacherId,
    mainScreenKey,
    subScreenKey,
    whiteBoardHidden,
  ]);

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

  const handleRtsFallback = () => {
    setRtsFallback(true);
  };

  const tabList = useMemo(
    () =>
      tabs.map(key => ({
        key,
        before:
          whiteBoardHidden &&
          (key === MaterialTabKey || key === CameraTabKey) ? (
            <div className={styles['h5tabs-item-button']}>
              <Icon component={SwitchArrowsSvg} onClick={onSwitch} />
            </div>
          ) : null,
      })),
    [tabs, whiteBoardHidden]
  );

  const liveUrlsForWebRTCSupported = useMemo(
    () => ({
      [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]:
        (interacting ? shadowLinkInfo : teacherLinkInfo)?.cdnPullInfo ?? {},
    }),
    [teacherLinkInfo, shadowLinkInfo, interacting]
  );
  // TODO: 旁路OK之后再生效
  // const liveUrlsForWebRTCSupported = useMemo(
  //   () => ({
  //     [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
  //     [SourceType.Camera]: shadowLinkInfo?.cdnPullInfo ?? {},
  //   }),
  //   [teacherLinkInfo, shadowLinkInfo]
  // );

  const liveUrlsForWebRTCNotSupported = useMemo(
    () => ({
      [SourceType.Material]: shadowLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]: teacherLinkInfo?.cdnPullInfo ?? {},
    }),
    [teacherLinkInfo, shadowLinkInfo]
  );

  const mainScreen = useMemo(
    () =>
      multiScreen ? (
        <H5Player
          id={mainScreenKey}
          noSource={!hasMainScreenSource}
          cdnUrlMap={liveUrlsForWebRTCSupported}
          sourceType={
            mainScreenKey === MaterialTabKey
              ? SourceType.Material
              : SourceType.Camera
          }
          // 主次画面中都会有声音，因此静音某个画面
          mute={mainScreenKey !== CameraTabKey && hasCamera}
          onBarVisibleChange={onBarVisibleChange}
          onRtsFallback={handleRtsFallback}
        />
      ) : (
        <H5Player
          id={CameraTabKey}
          sourceType={SourceType.Material}
          noSource={!hasMainScreenSource || !hasSubScreenSource}
          cdnUrlMap={liveUrlsForWebRTCNotSupported}
          rtsFirst={false}
          onBarVisibleChange={onBarVisibleChange}
        />
      ),
    [
      multiScreen,
      mainScreenKey,
      hasMainScreenSource,
      hasSubScreenSource,
      liveUrlsForWebRTCSupported,
      liveUrlsForWebRTCNotSupported,
      onBarVisibleChange,
    ]
  );

  const subScreen = useMemo(() => {
    if (!multiScreen || (tabKey !== CameraTabKey && tabKey !== MaterialTabKey))
      return null;

    const mute = subScreenKey !== CameraTabKey && hasCamera;
    if (tabKey === CameraTabKey)
      return (
        <H5Player
          id={CameraTabKey}
          noSource={!hasSubScreenSource}
          sourceType={SourceType.Camera}
          cdnUrlMap={liveUrlsForWebRTCSupported}
          mute={mute}
          controlBarVisibility="never"
        />
      );

    if (tabKey === MaterialTabKey)
      return (
        <H5Player
          id={MaterialTabKey}
          noSource={!hasSubScreenSource}
          sourceType={SourceType.Material}
          cdnUrlMap={liveUrlsForWebRTCSupported}
          mute={mute}
          controlBarVisibility="never"
        />
      );
  }, [
    multiScreen,
    tabKey,
    subScreenKey,
    hasSubScreenSource,
    liveUrlsForWebRTCSupported,
  ]);

  if (!active) return;

  return (
    <>
      <FrontContent
        onControlVisibleChange={onBarVisibleChange}
        hasWhiteBoard={multiScreen && !whiteBoardHidden}
      >
        {whiteBoardActivated && multiScreen ? null : mainScreen}
      </FrontContent>
      <div
        className={classNames(styles.h5main, {
          [styles['not-safe-area']]: !hasSafeAreaBottom,
        })}
      >
        {isInited ? (
          <Fragment>
            <H5Tabs
              value={tabKey}
              tabs={tabList}
              onChange={tab => setTabKey(tab)}
            />

            <div className={styles.h5content__player}>{subScreen}</div>
            {tabKey === ChatTabKey ? (
              <ChatPanel className={styles.h5content__chat} />
            ) : null}
            {tabKey === IntroTabKey ? (
              <IntroPanel className={styles.h5content__intro} />
            ) : null}

            <Announcement className={styles.h5announcement} />

            {tabKey === ChatTabKey ? (
              <ChatControls
                className={styles.h5controls}
                theme="light"
                heartIconActive
                allowChat={[
                  ClassroomStatusEnum.not_start,
                  ClassroomStatusEnum.started,
                ].includes(status)}
              />
            ) : null}
          </Fragment>
        ) : null}
      </div>
    </>
  );
}

export default BigClass;
