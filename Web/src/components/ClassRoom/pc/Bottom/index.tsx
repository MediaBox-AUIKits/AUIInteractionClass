import React, {
  useMemo,
  useEffect,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useThrottleFn } from 'ahooks';
import { CustomMessageTypes, ClassroomModeEnum } from '../../types';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import livePush from '../../utils/LivePush';
import { isValidDate } from '../../utils/common';
import logger, { EMsgid } from '../../utils/Logger';
import { PreviewPlayerId } from '../../constants';
import PushButton from './PushButton';
import Microphone from './Microphone';
import Camera from './Camera';
import ScreenShare from './ScreenShare';
import Board from './Board';
import Doc from './Doc';
import MultiMedia from './MultiMedia';
import Tools from './Tools';
import Setting from './Setting';
import InteractionApplication from './InteractionApplication';
import styles from './index.less';
import toast from '@/utils/toast';

const RoomBottom: React.FC = () => {
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const { services, auiMessage, userInfo, exit } = useContext(ClassContext);
  const {
    setClassroomInfo,
    setPusherExecuting,
    setPusherTime,
    setPushing,
    setMicrophoneTrackId,
    setMicrophoneEnable,
    setCameraTrackId,
    setCameraEnable,
    setConnectedSpectators,
    updateConnectedSpectator,
  } = useClassroomStore.getState();
  const [micDisabled, setMicDisabled] = useState<boolean>(true);
  const [cameraDisabled, setCameraDisabled] = useState<boolean>(true);

  // 获取推流信息相关参数，包含设备状态、推流轨道状态、推流地址等
  const getMeetingInfoParams = useCallback(() => {
    const { camera, microphone, display, localMedia, classroomInfo } =
      useClassroomStore.getState();
    const publishingStatus = livePusher.getPublishingStatus();
    // alivc-push-sdk 返回的轨道推流变化包含 isAudioPublishing（麦克风）、isCameraPublishing （摄像头）
    // isCustomPublishing（自定义流）、isScreenPublishing（屏幕流）
    // 接口、消息的字段名有所不同，而且自定义流和屏幕流公用一个字段，都算做屏幕流轨道
    return {
      isAudioPublishing: publishingStatus.isAudioPublishing,
      isVideoPublishing: publishingStatus.isCameraPublishing,
      isScreenPublishing:
        publishingStatus.isCustomPublishing ||
        publishingStatus.isScreenPublishing,
      cameraOpened: camera.enable,
      micOpened: microphone.enable,
      screenShare: display.enable, // 是否屏幕分享
      mutilMedia: !!localMedia.mediaStream, // 是否正在插播本地多媒体
      rtcPullUrl: classroomInfo.linkInfo?.rtcPullUrl,
    };
  }, []);

  const updateTeacherInteractionInfo = useCallback(() => {
    const self = {
      ...userInfo!,
      ...getMeetingInfoParams(),
    };
    updateConnectedSpectator(self.userId, self);
  }, [userInfo]);

  const { run: throttleMeetingInfo } = useThrottleFn(
    () => {
      const { pusher } = useClassroomStore.getState();
      if (!pusher.pushing) {
        return Promise.resolve();
      }
      return updateTeacherInteractionInfo();
    },
    {
      wait: 500,
      leading: false,
    }
  );

  const handleDeviceAndTrackChanged = async (
    type: number,
    data: any,
    ignorePushing = false
  ) => {
    const { joinedGroupId, pusher } = useClassroomStore.getState();
    if (!joinedGroupId || (!pusher.pushing && !ignorePushing)) {
      return;
    }
    // 通知其他用户状态改变
    const options = {
      type,
      data,
    };
    try {
      await auiMessage.sendGroupSignal(options);
      throttleMeetingInfo(); // 更新设备信息
    } catch (error) {
      //
    }
  };

  const initLivePusher = useCallback(async () => {
    // 先检查是否有麦克风、摄像头的权限
    const result = (await livePusher.checkMediaDevicePermission({
      audio: true,
      video: true,
    })) ?? {
      audio: false,
      video: false,
    };
    logger.reportInfo(EMsgid.MEDIA_DEVICE_PERMISSION, result);
    // 初始化
    await livePusher.init(result, userInfo?.userId);
    setCameraDisabled(!result.video);
    setMicDisabled(!result.audio);
    // 有可能推流sdk初始化成功前就有白板mediaStream了，但是那会调用 startCustomStream 会无效，所以需要init 之后再操作一次
    const { mediaStream } = useClassroomStore.getState().board;
    if (mediaStream) {
      livePusher.startCustomStream(mediaStream);
    }

    // 推流 track 增删事件
    livePusher.info.on('publishingtracksupdated', () => {
      // 需要通知学生推流变化
      const data = getMeetingInfoParams();
      handleDeviceAndTrackChanged(
        CustomMessageTypes.PublishInfoChanged,
        data,
        true
      );
    });
  }, [userInfo]);

  useEffect(() => {
    const networkrecoveryHandler = () => {
      // 断网重连后，需要重新混流
      const { pusher, camera } = useClassroomStore.getState();
      if (pusher.pushing) {
        livePusher.updateTranscodingConfig(camera.enable);
      }
    };

    livePusher.checkSystemRequirements().then(res => {
      logger.reportInfo(EMsgid.SYSTEM_REQUIREMENTS, res);
      if (!res.support) {
        toast.error('系统未支持推流！', 0);
        return;
      }
      initLivePusher();

      livePusher.network.on('networkrecovery', networkrecoveryHandler);
    });

    return () => {
      livePusher.network.off('networkrecovery', networkrecoveryHandler);
      livePush.destroyInstance('alivc');
    };
  }, [initLivePusher]);

  useEffect(() => {
    const off = useClassroomStore.subscribe(
      state => state.microphone,
      async (microphone, prevMicrophone) => {
        const {
          classroomInfo: { id },
        } = useClassroomStore.getState();
        // 退出教室页，不再响应
        if (!id) return;

        if (
          (microphone !== prevMicrophone &&
            microphone.enable !== prevMicrophone.enable) ||
          microphone.deviceId !== prevMicrophone.deviceId
        ) {
          // 麦克风有变化
          if (microphone.enable) {
            try {
              logger.reportInvoke(EMsgid.START_MIC);
              console.log('------ start mic -----');
              // 如果当前已经是 enable 则认为切换了麦克风
              await livePusher.startMicrophone(microphone.deviceId);
              setMicrophoneTrackId('mic');
              if (!microphone.fromInit && !prevMicrophone.enable) {
                toast.success('静音已取消');
                handleDeviceAndTrackChanged(CustomMessageTypes.MicChanged, {
                  micOpened: true,
                });
              }
              logger.reportInvokeResult(EMsgid.START_MIC_RESULT, true);
            } catch (error: any) {
              console.log('------ start mic error -----', error);
              setMicrophoneEnable(false, microphone.fromInit);
              logger.reportInvokeResult(
                EMsgid.START_MIC_RESULT,
                false,
                '',
                error
              );
            }
          } else if (prevMicrophone.enable) {
            try {
              logger.reportInvoke(EMsgid.STOP_MIC);
              console.log('------ stop mic -----');

              await livePusher.stopMicrophone();
              setMicrophoneTrackId('');
              if (!microphone.fromInit) {
                toast.success('静音已开启');
                handleDeviceAndTrackChanged(CustomMessageTypes.MicChanged, {
                  micOpened: false,
                });
              }

              logger.reportInvokeResult(EMsgid.STOP_MIC_RESULT, true);
            } catch (error) {
              console.log('------ stop mic error -----', error);
              logger.reportInvokeResult(
                EMsgid.STOP_MIC_RESULT,
                false,
                '',
                error
              );
            }
          }
        }
      }
    );
    return off;
  }, [livePusher]);

  useEffect(() => {
    const off = useClassroomStore.subscribe(
      state => state.camera,
      async (camera, prevCamera) => {
        const {
          classroomInfo: { id },
        } = useClassroomStore.getState();
        // 退出教室页，不再响应
        if (!id) return;

        if (
          camera !== prevCamera &&
          (camera.enable !== prevCamera.enable ||
            camera.deviceId !== prevCamera.deviceId)
        ) {
          if (camera.enable) {
            try {
              logger.reportInvoke(EMsgid.START_CAMERA);
              console.log('------ start camera -----');
              // 如果当前已经是 enable 则认为切换了摄像头
              await livePusher.startCamera(camera.deviceId);
              setCameraTrackId('camera'); // 目前暂时用这个，后续能取到真实的 trackId 再修改

              const {
                pusher: { pushing },
              } = useClassroomStore.getState();
              // 推流中，需要更新布局
              if (pushing) {
                await livePusher.updateTranscodingConfig(true);
              }
              // 开启预览
              livePusher.startPreview(PreviewPlayerId); // 注意和 SelfPlayer 保持一致
              console.log('------ startPreview -------');
              if (!camera.fromInit && !prevCamera.enable) {
                toast.success('摄像头已开启');
              }

              logger.reportInvokeResult(EMsgid.START_CAMERA_RESULT, true);
            } catch (error: any) {
              if (error?.message) {
                toast.warning(error?.message);
              }
              setCameraEnable(false, camera.fromInit);
              setCameraTrackId('');

              console.log('------ start camera error -----', error);
              logger.reportInvokeResult(
                EMsgid.START_CAMERA_RESULT,
                false,
                '',
                error
              );
            }
          } else if (prevCamera.enable) {
            try {
              logger.reportInvoke(EMsgid.STOP_CAMERA);
              console.log('------ stop camera -------');

              await livePusher.stopCamera();
              if (!camera.fromInit) {
                toast.success('摄像头已关闭');
              }
              setCameraTrackId('');

              // 更新布局
              await livePusher.updateTranscodingConfig(false);
              logger.reportInvokeResult(EMsgid.STOP_CAMERA_RESULT, true);
            } catch (error) {
              console.log('------ stop camera error -------', error);
              logger.reportInvokeResult(
                EMsgid.STOP_CAMERA_RESULT,
                false,
                '',
                error
              );
            }
          }
        }
      }
    );
    return off;
  }, [livePusher]);

  const startClass = useCallback(async () => {
    logger.reportInvoke(EMsgid.START_CLASS);

    try {
      const {
        classroomInfo: { linkInfo, shadowLinkInfo, mode },
        camera: { enable: cameraEnable },
      } = useClassroomStore.getState();

      if (
        !linkInfo?.rtcPushUrl ||
        (mode === ClassroomModeEnum.Big && !shadowLinkInfo?.rtcPushUrl)
      ) {
        throw new Error('rtc push url missed');
      }

      // 先推流
      await livePusher.startPush(
        linkInfo.rtcPushUrl,
        shadowLinkInfo?.rtcPushUrl
      );
      // 更新服务端
      const detail = await services?.startClass();
      // 推流成功后更新混流布局

      await livePusher.updateTranscodingConfig(cameraEnable);
      // 通过消息通知学生
      const options = {
        type: CustomMessageTypes.ClassStart,
        data: {},
      };
      await auiMessage.sendGroupSignal(options);

      // 更新 meetingInfo
      await updateTeacherInteractionInfo();

      // 更新课堂信息等
      const { classroomInfo } = useClassroomStore.getState();
      const info = {
        ...classroomInfo,
        ...detail,
      };
      setClassroomInfo(info);

      // 更新推送状态，时间
      let pustTime = info.startedAt ? new Date(info.startedAt) : new Date();
      pustTime = isValidDate(pustTime) ? pustTime : new Date();
      setPusherTime(pustTime);

      setPushing(true);
      setPusherExecuting(false);

      logger.reportInvokeResult(EMsgid.START_CLASS_RESULT, true);
    } catch (error) {
      setPusherExecuting(false);
      livePusher.stopPush();

      logger.reportInvokeResult(EMsgid.START_CLASS_RESULT, false, '', error);
    }
  }, [livePusher]);

  const stopClass = useCallback(async () => {
    logger.reportInvoke(EMsgid.STOP_CLASS);

    try {
      // 通过消息通知学生下课
      const options = {
        type: CustomMessageTypes.ClassStop,
        data: {},
      };
      await auiMessage.sendGroupSignal(options);
      try {
        // 停止推流
        await livePusher.stopPush();
        // 还原布局
        await livePusher.resetTranscodingConfig();
      } catch (error) {
        // 即便sdk停止推流也应该往下执行
      }
      await services?.stopClass();

      // 更新推送状态，时间
      setPushing(false);
      setPusherExecuting(false);
      setConnectedSpectators([]);

      toast.success('已下课，3秒后自动退出！');
      setTimeout(() => {
        exit();
      }, 3000);

      logger.reportInvokeResult(EMsgid.STOP_CLASS_RESULT, true);
    } catch (error) {
      setPusherExecuting(false);
      toast.error('下课失败，请检查网络');

      logger.reportInvokeResult(EMsgid.STOP_CLASS_RESULT, false, '', error);
    }
  }, [livePusher]);

  useEffect(() => {
    const off = useClassroomStore.subscribe(
      state => state.pusher,
      async (pusher, prevPusher) => {
        const {
          classroomInfo: { id },
        } = useClassroomStore.getState();
        // 退出教室页，不再响应
        if (!id) return;

        // 执行中为 true 时根据 pushing 的情况执行
        if (
          pusher !== prevPusher &&
          pusher.executing &&
          pusher.executing !== prevPusher.executing
        ) {
          if (pusher.pushing) {
            stopClass();
          } else {
            startClass();
          }
        }
      }
    );
    return off;
  }, [startClass, stopClass]);

  // 处理屏幕分享的数据
  useEffect(() => {
    const off = useClassroomStore.subscribe(
      state => state.display,
      async (display, prevDisplay) => {
        const {
          classroomInfo: { id },
        } = useClassroomStore.getState();
        // 退出教室页，不再响应
        if (!id) return;

        if (display !== prevDisplay && display.enable !== prevDisplay.enable) {
          // 屏幕分享变化了，需要通过更新老师的 meetingInfo 信息，触发发消息通知学生
          // TODO: 这个方式不适用 公开课模式，后续若公开课学生端也加载白板，这里需要改造
          throttleMeetingInfo();

          const { board } = useClassroomStore.getState();
          // 关闭屏幕分享时需要更新为白板流
          if (!display.enable && board.mediaStream) {
            auiMessage.sendGroupSignal({
              type: CustomMessageTypes.WhiteBoardVisible,
            });
            console.log(
              '------ startCustomStream: board (screenShare stopped) -----'
            );
            livePusher.startCustomStream(board.mediaStream);
          }
        }
      }
    );
    return off;
  }, [livePusher, throttleMeetingInfo]);

  // 处理白板数据
  useEffect(() => {
    const off = useClassroomStore.subscribe(
      state => state.board,
      async (board, prevBoard) => {
        const {
          classroomInfo: { id },
          display: { enable: displayEnable },
          localMedia: { mediaStream: localMediaStream },
        } = useClassroomStore.getState();
        // 退出教室页，不再响应
        if (!id) return;

        if (board !== prevBoard) {
          if (board.mediaStream && !displayEnable && !localMediaStream) {
            console.log('------ startCustomStream: board (board changed)-----');
            livePusher.startCustomStream(board.mediaStream);
          } else {
            livePusher.stopCustomStream(board.mediaStream);
          }
        }
      }
    );
    return off;
  }, [livePusher]);

  // 处理本地视频插播
  useEffect(() => {
    const off = useClassroomStore.subscribe(
      state => state.localMedia,
      async (localMedia, prevLocalMeida) => {
        const {
          classroomInfo: { id },
        } = useClassroomStore.getState();
        // 退出教室页，不再响应
        if (!id) return;

        if (localMedia.mediaStream !== prevLocalMeida.mediaStream) {
          const { board, display } = useClassroomStore.getState();
          // 当有本地媒体文件的流时推这个
          if (localMedia.mediaStream) {
            console.log('------ startCustomStream: localMedia -----');
            livePusher.startCustomStream(localMedia.mediaStream);
          } else if (board.mediaStream && !display.enable) {
            auiMessage.sendGroupSignal({
              type: CustomMessageTypes.WhiteBoardVisible,
            });
            console.log(
              '------ startCustomStream: board (localMedia stopped) -----'
            );
            livePusher.startCustomStream(board.mediaStream);
          }

          // 插播变化了，需要通过更新老师的 meetingInfo 信息，触发发消息通知学生
          // TODO: 这个方式不适用 公开课模式，后续若公开课学生端也加载白板，这里需要改造
          if (!prevLocalMeida.mediaStream) {
            // 无 -> 有
            throttleMeetingInfo();
          } else if (!localMedia.mediaStream) {
            // 有 -> 无
            throttleMeetingInfo();
          }
        }
      }
    );
    return off;
  }, [livePusher, throttleMeetingInfo]);

  return (
    <div className={styles['pc-bottom']}>
      <div className={styles['left-part']}>
        <Microphone disabled={micDisabled} />
        <Camera disabled={cameraDisabled} />
      </div>
      <div className={styles['center-part']}>
        <ScreenShare />
        <Board />
        <Doc />
        <MultiMedia />
        <Tools canUpdateAnnouncement canManageCheckIn />
        <Setting canMuteGroup canMuteInteraction canAllowInteraction />
        <InteractionApplication />
      </div>
      <div className={styles['right-part']}>
        <PushButton />
      </div>
    </div>
  );
};

export default RoomBottom;
