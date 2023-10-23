/**
 * 该文件为 PC 学生端底部组件
 */
import React, { useEffect, useMemo, useContext } from 'react';
import Microphone from './Microphone';
import Camera from './Camera';
import ApplicationPC from './ApplicationPC';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { ClassroomModeEnum } from '../../types';
import toast from '@/utils/toast';
import logger from '@/components/ClassRoom/utils/Logger';
import livePush from '@/components/ClassRoom/utils/LivePush';
import styles from './index.less';
import { StudentInteractionManager } from '../../utils/InteractionManager';

const StudentBottom: React.FC = () => {
  const { interactionManager, userInfo } = useContext(ClassContext);
  const {
    classroomInfo: { mode, teacherId },
    interacting,
    supportWebRTC,
    setMicrophoneTrackId,
    setMicrophoneEnable,
    setMicrophoneControlling,
    setCameraTrackId,
    setCameraEnable,
    setCameraControlling,
  } = useClassroomStore(state => state);

  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);

  const deviceDisabled = useMemo(
    () => !interacting || !supportWebRTC,
    [interacting, supportWebRTC]
  );
  const disabledTooltip = useMemo(() => {
    if (!supportWebRTC) {
      return '浏览器暂不支持连麦';
    }
    if (!interacting) return '连麦后可使用';
  }, [interacting, supportWebRTC]);

  const handleCameraStatusChanged = (turnOn: boolean) => {
    (interactionManager as StudentInteractionManager).notifyCameraStatusChanged(
      {
        studentId: userInfo?.userId ?? '',
        teacherId: '',
        turnOn,
      }
    );
  };

  const handleMicStatusChanged = (turnOn: boolean) => {
    (interactionManager as StudentInteractionManager).notifyMicStatusChanged({
      studentId: userInfo?.userId ?? '',
      teacherId: '',
      turnOn,
    });
  };

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.camera,
      async (camera, prevCamera) => {
        const { controlledCameraOpened } = useClassroomStore.getState();

        // 摄像头有变化
        if (
          camera.enable !== prevCamera.enable ||
          camera.deviceId !== prevCamera.deviceId
        ) {
          let success = false;
          if (camera.enable) {
            if (!controlledCameraOpened) {
              toast.warning('老师已将你的摄像头关闭');
              const timer = window.setTimeout(() => {
                setCameraEnable(false);
                clearTimeout(timer);
              }, 0);
              return;
            }
            try {
              logger.startCamera();
              // 如果当前已经是 enable 则认为切换了摄像头
              await livePusher.startCamera(camera.deviceId);
              setCameraTrackId('camera'); // 目前暂时用这个，后续能取到真实的 trackId 再修改
              console.log('------Camera started-------');
              if (!camera.fromInit && !prevCamera.enable) {
                toast.success('摄像头已开启');
                handleCameraStatusChanged(true);
              }
              success = true;
            } catch (error: any) {
              logger.startCameraError(error);
              console.log('start camera error ->', error);
              if (error?.message) {
                toast.warning(error?.message);
              }
              setCameraEnable(false, camera.fromInit);
              setCameraTrackId('');
              success = false;
            }
          } else if (prevCamera.enable) {
            try {
              logger.stopCamera();
              await livePusher.stopCamera();
              setCameraTrackId('');
              console.log('------stopCamera-------');
              if (!camera.fromInit) {
                toast.success('摄像头已关闭');
                handleCameraStatusChanged(false);
              }
              success = true;
            } catch (error) {
              success = false;
            }
          }
          // 受控调整结束后，告知结果并重置标记位
          if (camera.controlling) {
            (
              interactionManager as StudentInteractionManager
            ).answerCameraControl({
              studentId: userInfo?.userId ?? '',
              teacherId: teacherId,
              failed: !success,
            });
            setCameraControlling(false);
          }
        }
      }
    );
    return sub;
  }, [livePusher, interactionManager]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.microphone,
      async (microphone, prevMicrophone) => {
        const { controlledMicOpened } = useClassroomStore.getState();

        // 麦克风有变化
        if (
          microphone.enable !== prevMicrophone.enable ||
          microphone.deviceId !== prevMicrophone.deviceId
        ) {
          let success = false;
          if (microphone.enable) {
            if (!controlledMicOpened) {
              toast.warning('老师已将你的麦克风静音');
              const timer = window.setTimeout(() => {
                setMicrophoneEnable(false);
                clearTimeout(timer);
              }, 0);
              return;
            }
            try {
              logger.startMic();
              // 如果当前已经是 enable 则认为切换了麦克风
              await livePusher.startMicrophone(microphone.deviceId);
              setMicrophoneTrackId('mic');
              console.log('------ start mic -----');
              if (!microphone.fromInit && !prevMicrophone.enable) {
                toast.success('静音已取消');
                handleMicStatusChanged(true);
              }
              success = true;
            } catch (error: any) {
              logger.startMicError(error);
              console.log('start mic error ->', error);
              if (error?.message) {
                toast.warning(error?.message);
              }
              setMicrophoneEnable(false, microphone.fromInit);
              setMicrophoneTrackId('');
              success = false;
            }
          } else if (prevMicrophone.enable) {
            try {
              logger.stopMic();
              await livePusher.stopMicrophone();
              setMicrophoneTrackId('');
              console.log('------stopMic-------');
              if (!microphone.fromInit) {
                toast.success('静音已开启');
                handleMicStatusChanged(false);
              }
              success = true;
            } catch (error) {
              success = false;
            }
          }
          // 受控调整结束后，告知结果并重置标记位
          if (microphone.controlling) {
            (interactionManager as StudentInteractionManager).answerMicControl({
              studentId: userInfo?.userId ?? '',
              teacherId: teacherId,
              failed: !success,
            });
            setMicrophoneControlling(false);
          }
        }
      }
    );
    return sub;
  }, [livePusher, interactionManager]);

  if (mode === undefined || mode === ClassroomModeEnum.Open) {
    return null;
  }
  return (
    <div className={styles['pc-bottom']}>
      <div className={styles['left-part']}>
        <Microphone
          disabled={deviceDisabled}
          disabledTooltip={disabledTooltip}
        />
        <Camera disabled={deviceDisabled} disabledTooltip={disabledTooltip} />
        <div className={styles['pc-bottom__button-divider']}></div>
        <ApplicationPC />
      </div>
    </div>
  );
};

export default StudentBottom;
