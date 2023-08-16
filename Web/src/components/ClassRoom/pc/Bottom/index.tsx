import React, {
  useMemo,
  useEffect,
  useCallback,
  useContext,
  useState,
} from 'react';
import { message } from 'antd';
import { CustomMessageTypes } from '../../types';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import livePush from '../../utils/LivePush';
import { isValidDate } from '../../utils/common';
import logger from '../../utils/Logger';
import { PreviewPlayerId } from '../../constances';
import PushButton from './PushButton';
import Microphone from './Microphone';
import Camera from './Camera';
import ScreenShare from './ScreenShare';
import Board from './Board';
import Doc from './Doc';
import styles from './index.less';

const RoomBottom: React.FC = () => {
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const { services, auiMessage, exit } = useContext(ClassContext);
  const {
    setClassroomInfo,
    setPusherExecuting,
    setPusherTime,
    setPushing,
    setMicrophoneTrackId,
    setMicrophoneEnable,
    setCameraTrackId,
    setCameraEnable,
  } = useClassroomStore.getState();
  const [micDisabled, setMicDisabled] = useState<boolean>(true);
  const [cameraDisabled, setCameraDisabled] = useState<boolean>(true);

  const initLivePusher = useCallback(async () => {
    // 先检查是否有麦克风、摄像头的权限
    const result = (await livePusher.checkMediaDevicePermission({
      audio: true,
      video: true,
    })) || {
      audio: false,
      video: false,
    };
    logger.mediaDevicePermission(result);
    // 初始化
    await livePusher.init();
    setCameraDisabled(!result.video);
    setMicDisabled(!result.audio);
    // 有可能推流sdk初始化成功前就有白板mediaStream了，但是那会调用 startCustomStream 会无效，所以需要init 之后再操作一次
    const { mediaStream } = useClassroomStore.getState().board;
    if (mediaStream) {
      livePusher.startCustomStream(mediaStream);
    }

    // livePusher.info.on('pushstatistics', (_stat: any) => {
    //   console.log(_stat);
    // });
    // livePusher.error.on('system', (error: any) => {
    //   console.log(error);
    // });
  }, []);

  useEffect(() => {
    const networkrecoveryHandler = () => {
      // 断网重连后，需要重新混流
      const { pusher, camera } = useClassroomStore.getState();
      if (pusher.pushing) {
        livePusher.updateTrancodingConfig(camera.enable);
      }
    };

    livePusher.checkSystemRequirements().then(res => {
      logger.systemRequirements(res);
      if (!res.support) {
        message.error({
          content: '系统未支持推流！',
          duration: 0,
        });
        return;
      }
      initLivePusher();

      livePusher.network.on('networkrecovery', networkrecoveryHandler);
    });

    return () => {
      livePusher.network.off('networkrecovery', networkrecoveryHandler);
      livePush.destroyInstance('alivc');
    };
  }, []);

  const startClass = useCallback(
    async (pushUrl: string, joinedGroupId: string, includeCamera: boolean) => {
      logger.startClass();
      try {
        // 先推流
        await livePusher.startPush(pushUrl);
        // 更新服务端
        const detail = await services?.startClass();
        // 推流成功后更新混流布局
        await livePusher.updateTrancodingConfig(includeCamera);
        // 通过消息通知学生
        const options = {
          groupId: joinedGroupId,
          type: CustomMessageTypes.ClassStart,
          data: {},
        };
        await auiMessage.sendMessageToGroup(options);

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
        setPushing(true);
        setPusherTime(pustTime);
        setPusherExecuting(false);
      } catch (error) {
        logger.startClassError(error);
        setPusherExecuting(false);
        livePusher.stopPush();
      }
    },
    []
  );

  const stopClass = useCallback(async (joinedGroupId: string) => {
    logger.stopClass();
    try {
      // 通过消息通知学生下课
      const options = {
        groupId: joinedGroupId,
        type: CustomMessageTypes.ClassStop,
        data: {},
      };
      await auiMessage.sendMessageToGroup(options);
      try {
        // 停止推流
        await livePusher.stopPush();
        // 还原布局
        await livePusher.resetTrancodingConfig();
      } catch (error) {
        // 即便sdk停止推流也应该往下执行
      }
      await services?.stopClass();

      // 更新推送状态，时间
      setPushing(false);
      setPusherExecuting(false);
      message.success('已下课，3秒后自动退出！');
      setTimeout(() => {
        exit();
      }, 3000);
    } catch (error) {
      logger.stopClassError(error);
      setPusherExecuting(false);
      message.error('下课失败，请检查网络');
    }
  }, []);

  const updateDeviceStatus = async (type: number, data: any) => {
    const { joinedGroupId, pusher } = useClassroomStore.getState();
    if (!pusher.pushing) {
      return;
    }
    // 通知其他用户状态改变
    const options = {
      groupId: joinedGroupId,
      type,
      data,
    };
    try {
      await auiMessage.sendMessageToGroup(options);
    } catch (error) {
      //
    }
  };

  useEffect(() => {
    const off = useClassroomStore.subscribe(async (state, prevState) => {
      const { microphone, camera, pusher, classroomInfo, board, display } =
        state;
      const {
        microphone: prevMicrophone,
        camera: prevCamera,
        pusher: prevPusher,
        classroomInfo: prevClassroomInfo,
        board: prevBoard,
        display: prevDisplay,
      } = prevState;

      // 通过 id 的变化来判断是否重置了，就不再执行了
      const isReset = !classroomInfo.id && prevClassroomInfo.id;
      if (isReset) {
        return;
      }

      // 麦克风有变化
      if (
        microphone !== prevMicrophone &&
        (microphone.enable !== prevMicrophone.enable ||
          microphone.deviceId !== prevMicrophone.deviceId)
      ) {
        if (microphone.enable) {
          try {
            // 如果当前已经是 enable 则认为切换了麦克风
            console.log('------ start mic -----');
            logger.startMic();
            await livePusher.startMicrophone(microphone.deviceId);
            setMicrophoneTrackId('mic');
            if (!microphone.fromInit && !prevMicrophone.enable) {
              message.success('静音已取消');
              updateDeviceStatus(CustomMessageTypes.MicChanged, {
                micOpened: true,
              });
            }
          } catch (error: any) {
            logger.startMicError(error);
            console.error(error);
            setMicrophoneEnable(false, microphone.fromInit);
          }
        } else if (prevMicrophone.enable) {
          logger.stopMic();
          await livePusher.stopMicrophone();
          setMicrophoneTrackId('');
          if (!microphone.fromInit) {
            message.success('静音已开启');
            updateDeviceStatus(CustomMessageTypes.MicChanged, {
              micOpened: false,
            });
          }
        }
      }

      // 摄像头有变化
      if (
        camera !== prevCamera &&
        (camera.enable !== prevCamera.enable ||
          camera.deviceId !== prevCamera.deviceId)
      ) {
        if (camera.enable) {
          try {
            logger.startCamera();
            // 如果当前已经是 enable 则认为切换了摄像头
            await livePusher.startCamera(camera.deviceId);
            setCameraTrackId('camera'); // 目前暂时用这个，后续能取到真实的 trackId 再修改
            console.log('------Camera started-------');
            if (pusher.pushing) {
              // 更新布局
              await livePusher.updateTrancodingConfig(true);
            }
            // 开启预览
            livePusher.startPreview(PreviewPlayerId); // 注意和 SelfPlayer 保持一致
            console.log('------startPreview-------');
            if (!camera.fromInit && !prevCamera.enable) {
              message.success('摄像头已开启');
            }
          } catch (error: any) {
            logger.startCameraError(error);
            console.log('start camera error ->', error);
            if (error?.message) {
              message.error(error?.message);
            }
            setCameraEnable(false, camera.fromInit);
            setCameraTrackId('');
          }
        } else if (prevCamera.enable) {
          if (!camera.fromInit) {
            message.success('摄像头已关闭');
          }
          logger.stopCamera();
          console.log('------stopCamera-------');
          livePusher.stopCamera();
          setCameraTrackId('');
          // 更新布局
          await livePusher.updateTrancodingConfig(false);
        }
      }

      // 执行中为 true 时根据 pushing 的情况执行
      if (
        pusher !== prevPusher &&
        pusher.executing &&
        pusher.executing !== prevPusher.executing
      ) {
        const { classroomInfo, joinedGroupId } = useClassroomStore.getState();
        if (!classroomInfo || !joinedGroupId) {
          return;
        }

        const pushUrl = classroomInfo.linkInfo?.rtcPushUrl;
        if (!pushUrl) {
          return;
        }
        if (pusher.pushing) {
          stopClass(joinedGroupId);
        } else {
          startClass(pushUrl, joinedGroupId, camera.enable);
        }
      }

      // 处理白板数据
      if (board !== prevBoard) {
        if (board.mediaStream) {
          console.log('------startCustomStream-----');
          livePusher.startCustomStream(board.mediaStream);
        } else {
          livePusher.stopCustomStream(board.mediaStream);
        }
      }

      // 关闭屏幕分享时需要更新为白板流
      if (
        display !== prevDisplay &&
        !display.enable &&
        display.enable !== prevDisplay.enable &&
        board.mediaStream
      ) {
        livePusher.startCustomStream(board.mediaStream);
      }
    });

    return () => {
      off();
    };
  }, [startClass, stopClass]);

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
      </div>
      <div className={styles['right-part']}>
        <PushButton
          isMicrophoneDisabled={micDisabled}
          isCameraDisabled={cameraDisabled}
        />
      </div>
    </div>
  );
};

export default RoomBottom;
