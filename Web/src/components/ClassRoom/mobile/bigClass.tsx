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
// import { Toast } from 'antd-mobile';
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
    classroomInfo: {
      status,
      teacherId,
      linkInfo: teacherLinkInfo,
      shadowLinkInfo, // 不支持 WebRTC 的设备上，只展示一个画面，画面是混流后的布局，数据来源是 shadowLinkInfo
    },
    connectedSpectators,
  } = useClassroomStore(state => state);

  const isInited = useMemo(() => {
    return status !== ClassroomStatusEnum.no_data;
  }, [status]);

  const [tabs, setTabs] = useState<string[]>([]);
  const [tabKey, setTabKey] = useState(CameraTabKey);
  const [supportWebRTC, setSupportWebRTC] = useState<boolean | undefined>(
    undefined
  );
  useEffect(() => {
    const check = async () => {
      const result = await checkSystemRequirements();
      // TODO: DEL
      // Toast.show({
      //   content: `检测 WebRTC ${result.support ? 'pass' : 'failed'}`,
      //   duration: 1000,
      // });
      setSupportWebRTC(result.support);
    };
    check();
  }, []);

  const linkInfo = useMemo(() => {
    if (supportWebRTC === undefined) return;
    return supportWebRTC ? teacherLinkInfo : shadowLinkInfo;
  }, [supportWebRTC, teacherLinkInfo, shadowLinkInfo]);

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

  useEffect(() => {
    const teacherPubStatus = connectedSpectators.find(
      item => item.userId === teacherId
    ) ?? {
      isAudioPublishing: false,
      isScreenPublishing: false,
      isVideoPublishing: false,
    };
    setHasCamera(!!teacherPubStatus.isVideoPublishing);
  }, [connectedSpectators, teacherId]);

  const handleRtsFallback = () => {
    // TODO: DEL
    // Toast.show({
    //   content: 'RTS 降级',
    //   duration: 1000,
    // });
    setSupportWebRTC(false);
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

  if (!active) return;

  const mainScreen = supportWebRTC ? (
    <H5Player
      id={mainScreenKey}
      noSource={mainScreenKey === CameraTabKey && !hasCamera}
      linkInfo={linkInfo}
      sourceType={
        mainScreenKey === MaterialTabKey
          ? SourceType.Material
          : SourceType.Camera
      }
      onBarVisibleChange={onBarVisibleChange}
      onRtsFallback={handleRtsFallback}
    />
  ) : (
    <H5Player
      id={CameraTabKey}
      linkInfo={linkInfo}
      rtsFirst={false}
      onBarVisibleChange={onBarVisibleChange}
    />
  );

  // 主次画面中都会有声音，因此次画面可以静音处理
  const subScreen =
    supportWebRTC && tabKey === CameraTabKey ? (
      <H5Player
        id={CameraTabKey}
        mute={true}
        noSource={!hasCamera}
        sourceType={SourceType.Camera}
        linkInfo={linkInfo}
        controlBarVisibility="never"
      />
    ) : supportWebRTC && tabKey === MaterialTabKey ? (
      <H5Player
        id={MaterialTabKey}
        mute={true}
        sourceType={SourceType.Material}
        linkInfo={linkInfo}
        controlBarVisibility="never"
      />
    ) : null;

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
