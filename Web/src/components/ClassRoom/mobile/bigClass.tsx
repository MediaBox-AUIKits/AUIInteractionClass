import React, {
  useState,
  useMemo,
  Fragment,
  useCallback,
  useEffect,
} from 'react';
import classNames from 'classnames';
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
import Icon from '@ant-design/icons';
import { SwitchArrowsSvg } from '../components/icons';
import { ClassroomStatusEnum, SourceType } from '../types';
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

  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMainScreenSource, setHasMainScreenSource] =
    useState<boolean>(false);
  const [hasSubScreenSource, setHasSubScreenSource] = useState<boolean>(false);

  useEffect(() => {
    const teacherPubStatus = connectedSpectators.find(
      item => item.userId === teacherId
    ) ?? {
      isAudioPublishing: false,
      isScreenPublishing: false,
      isVideoPublishing: false,
    };
    const hasCamera = !!teacherPubStatus.isVideoPublishing;
    const hasMaterial = !!teacherPubStatus.isScreenPublishing;
    setHasCamera(hasCamera);
    setHasMainScreenSource(
      mainScreenKey === MaterialTabKey ? hasMaterial : hasCamera
    );
    setHasSubScreenSource(
      subScreenKey === MaterialTabKey ? hasMaterial : hasCamera
    );
  }, [connectedSpectators, teacherId, mainScreenKey, subScreenKey]);

  const handleRtsFallback = () => {
    setRtsFallback(true);
  };

  const tabList = useMemo(
    () =>
      tabs.map(key => ({
        key,
        before:
          key === MaterialTabKey || key === CameraTabKey ? (
            <div className={styles['h5tabs-item-button']}>
              <Icon component={SwitchArrowsSvg} onClick={onSwitch} />
            </div>
          ) : null,
      })),
    [tabs]
  );

  const liveUrlsForWebRTCSupported = useMemo(
    () => ({
      [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]:
        (interacting ? shadowLinkInfo : teacherLinkInfo)?.cdnPullInfo ?? {},
    }),
    [teacherLinkInfo, shadowLinkInfo, interacting]
  );

  const liveUrlsForWebRTCNotSupported = useMemo(
    () => ({
      [SourceType.Material]: shadowLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]: teacherLinkInfo?.cdnPullInfo ?? {},
    }),
    [teacherLinkInfo, shadowLinkInfo]
  );

  const mainScreen = useMemo(
    () =>
      supportWebRTC && !rtsFallback ? (
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
      supportWebRTC,
      mainScreenKey,
      hasMainScreenSource,
      hasSubScreenSource,
      liveUrlsForWebRTCSupported,
      liveUrlsForWebRTCNotSupported,
      onBarVisibleChange,
    ]
  );

  const subScreen = useMemo(() => {
    if (
      !supportWebRTC ||
      rtsFallback ||
      (tabKey !== CameraTabKey && tabKey !== MaterialTabKey)
    )
      return null;

    if (tabKey === CameraTabKey)
      return (
        <H5Player
          id={CameraTabKey}
          noSource={!hasSubScreenSource}
          sourceType={SourceType.Camera}
          cdnUrlMap={liveUrlsForWebRTCSupported}
          mute={subScreenKey !== CameraTabKey && hasCamera}
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
          mute={subScreenKey !== CameraTabKey && hasCamera}
          controlBarVisibility="never"
        />
      );
  }, [
    supportWebRTC,
    rtsFallback,
    tabKey,
    subScreenKey,
    hasSubScreenSource,
    liveUrlsForWebRTCSupported,
  ]);

  if (!active) return;

  return (
    <>
      {mainScreen}
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

            {subScreen}
            <IntroPanel
              className={styles.h5content}
              hidden={tabKey !== IntroTabKey}
            />

            {tabs.includes(ChatTabKey) ? (
              <ChatPanel
                className={styles.h5content}
                hidden={tabKey !== ChatTabKey}
              />
            ) : null}
            <></>

            <ChatControls
              className={styles.h5controls}
              theme="light"
              heartIconActive
              allowChat={
                tabKey === ChatTabKey &&
                [
                  ClassroomStatusEnum.not_start,
                  ClassroomStatusEnum.started,
                ].includes(status)
              }
            />
          </Fragment>
        ) : null}
      </div>
    </>
  );
}

export default BigClass;
