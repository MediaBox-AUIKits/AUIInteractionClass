import React, { useMemo, useState, useEffect, useRef, Fragment } from 'react';
import classNames from 'classnames';
import {
  ClassroomModeEnum,
  ClassroomStatusEnum,
  SourceType,
} from '../../types';
import useClassroomStore from '../../store';
import { checkSystemRequirements } from '../../utils/common';
import livePush from '../../utils/LivePush';
import RoomAside, { AsidePlayerTypes } from '../Aside';
import StudentBottom from '../Bottom/StudentBottom';
import H5Player from '../../mobile/H5Player';
import AsidePlayer from './AsidePlayer';
import RoomInteractionList from '../InteractionList';
import styles from './styles.less';

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

  const teacherInteractingCamera = useRef<HTMLVideoElement | null>(null);
  const teacherInteractingScreen = useRef<HTMLVideoElement | null>(null);
  const [micOpened, setMicOpened] = useState<boolean>(false);
  const [mainScreenKey, setMainScreenKey] = useState(MaterialTabKey);
  const [subScreenKey, setSubScreenKey] = useState(CameraTabKey);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMainScreenSource, setHasMainScreenSource] =
    useState<boolean>(false);
  const [hasSubScreenSource, setHasSubScreenSource] = useState<boolean>(false);
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
    [connectedSpectators]
  );

  useEffect(() => {
    const teacherPubStatus = teacherInteractionInfo ?? {
      isAudioPublishing: false,
      isScreenPublishing: false,
      isVideoPublishing: false,
      micOpened: false,
    };
    setMicOpened(!!teacherPubStatus.micOpened);
    const hasCamera = !!teacherPubStatus.isVideoPublishing;
    const hasMaterial = !!teacherPubStatus.isScreenPublishing;
    setHasCamera(hasCamera);
    setHasMainScreenSource(
      mainScreenKey === MaterialTabKey ? hasMaterial : hasCamera
    );
    setHasSubScreenSource(
      subScreenKey === MaterialTabKey ? hasMaterial : hasCamera
    );
  }, [teacherInteractionInfo, mainScreenKey, subScreenKey]);

  const player = useMemo(() => {
    return livePush.createPlayerInstance();
  }, []);

  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    if (
      player &&
      teacherInteractionInfo?.rtcPullUrl &&
      !pulling &&
      teacherInteractingCamera.current &&
      teacherInteractingScreen.current
    ) {
      const startPlay = async () => {
        try {
          await player.startPlay(
            teacherInteractionInfo?.rtcPullUrl as string,
            teacherInteractingCamera.current!,
            teacherInteractingScreen.current!
          );
          setPulling(true);
        } catch (error) {
          console.log(error);
        }
      };
      startPlay();
    }
  }, [
    player,
    pulling,
    teacherInteractionInfo,
    teacherInteractingCamera.current,
    teacherInteractingScreen.current,
  ]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.interacting,
      (val, prevVal) => {
        if (!val && prevVal) {
          setPulling(false);
          setRtsFallback(false);
        }
      }
    );
    return sub;
  }, []);

  useEffect(() => {
    return () => {
      if (
        player &&
        teacherInteractingCamera.current &&
        teacherInteractingScreen.current
      ) {
        player.stopPlay();
      }
    };
  }, [player]);

  const bigClassLiveUrlsForWebRTCSupported = useMemo(() => {
    return {
      [SourceType.Material]: teacherLinkInfo?.cdnPullInfo ?? {},
      [SourceType.Camera]:
        (connectedSpectators.length > 1 ? shadowLinkInfo : teacherLinkInfo)
          ?.cdnPullInfo ?? {},
    };
  }, [teacherLinkInfo, shadowLinkInfo, connectedSpectators]);

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
      if (!supportWebRTC || rtsFallback) {
        return undefined;
      }

      return (
        <AsidePlayer micOpened={micOpened} onSwitchView={toggleView}>
          {interacting && teacherInteractionInfo ? (
            <video
              id="interaction-camera"
              ref={teacherInteractingCamera}
              className={styles['student-page__video']}
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
    supportWebRTC,
    rtsFallback,
    subScreenKey,
    micOpened,
    interacting,
    hasSubScreenSource,
    bigClassLiveUrlsForWebRTCSupported,
  ]);

  return (
    <Fragment>
      <div className="amaui-classroom__body">
        <div className="amaui-classroom__main">
          {interacting ? (
            <RoomInteractionList wrapClassName="amaui-classroom__main__speaker" />
          ) : null}
          <div
            className={classNames(
              'amaui-classroom__main__content',
              styles['student-main-player']
            )}
          >
            {interacting ? (
              <video
                ref={teacherInteractingScreen}
                id="interaction-shareScreen"
                muted
                className={styles['student-page__video']}
              ></video>
            ) : mode === ClassroomModeEnum.Open ? (
              <H5Player
                id="mainPlayer"
                device="pc"
                noSource={!teacherInteractionInfo}
                cdnUrlMap={openClassLiveUrls}
                sourceType={SourceType.Camera}
              />
            ) : supportWebRTC && !rtsFallback ? (
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
            ) : (
              <H5Player
                id="mainPlayer"
                device="pc"
                sourceType={SourceType.Material}
                noSource={!hasMainScreenSource || !hasSubScreenSource}
                cdnUrlMap={bigClassLiveUrlsForWebRTCNotSupported}
                rtsFirst={false}
              />
            )}
          </div>
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
