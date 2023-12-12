import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Modal, Tooltip } from 'antd';
import { Dialog } from 'antd-mobile';
import InteractionInvitationModal from './InteractionInvitation';
import NoDevicePermissionsModal from './NoDevicePermissions';
import useClassroomStore from '@/components/ClassRoom/store';
import AlivcPusher from '@/components/ClassRoom/utils/LivePush/AlivcPusher';
import livePush from '@/components/ClassRoom/utils/LivePush';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import { CustomMessageTypes } from '@/components/ClassRoom/types';
import {
  InteractionApplicationEvent,
  StudentEndInteractionEvent,
  StudentInteractionManager,
  RejectInteractionInvitationReason,
} from '@/components/ClassRoom/utils/InteractionManager';
import { UA } from '@/utils/common';
import logger, { EMsgid } from '@/components/ClassRoom/utils/Logger';
import toast from '@/utils/toast';
import { getEnumKey } from '@/utils/common';
import { formatTime } from '@/components/ClassRoom/utils/common';

interface StudentInteractionProps {
  compWrapperClassName: string;
  initialComp: React.ReactNode;
  disabledComp: React.ReactNode;
  loadingComp: React.ReactNode;
  activeComp: React.ReactNode;
}

interface MediaDevicePermission {
  audio?: boolean;
  video?: boolean;
}

function StudentInteraction(props: StudentInteractionProps) {
  const {
    compWrapperClassName,
    initialComp,
    disabledComp,
    loadingComp,
    activeComp,
  } = props;
  const { auiMessage, interactionManager, userInfo } = useContext(ClassContext);
  const {
    classroomInfo: { teacherId, linkInfo },
    interacting,
    interactionStarting,
    supportWebRTC,
    interactionAllowed,
    controlledCameraOpened,
    controlledMicOpened,
    pusher,
    camera,
    microphone,
    setInteracting,
    setInteractionStarting,
    setPushing,
    setCameraEnable,
    setCameraControlling,
    setMicrophoneEnable,
    setMicrophoneControlling,
    setControlledCameraOpened,
    setControlledMicOpened,
    setInteractionAllowed,
    setAllMicMuted,
  } = useClassroomStore(state => state);

  const [applicationWaiting, setApplicationWaiting] = useState(false);
  const [applicationAccepted, setApplicationAccepted] = useState(false);
  const [interactionInvitationSessionId, setInteractionInvitationSessionId] =
    useState<string | undefined>();
  const [mediaDevicePermission, setMediaDevicePermission] =
    useState<MediaDevicePermission>({
      audio: false,
      video: false,
    });
  const [disabled, setDisabled] = useState(
    !supportWebRTC || !interactionAllowed
  );
  const [noDevicePermissionsModalVisible, setNoDevicePermissionsModalVisible] =
    useState(false);

  useEffect(() => {
    if (supportWebRTC === false) {
      toast.error('当前浏览器暂不支持连麦');
    }
    setDisabled(
      !supportWebRTC || !interactionAllowed || !!interactionInvitationSessionId
    );
  }, [supportWebRTC, interactionAllowed, interactionInvitationSessionId]);

  const [livePusher, setLivePusher] = useState<AlivcPusher>();

  useEffect(() => {
    const livePusher = livePush.getInstance('alivc')!;
    setLivePusher(livePusher);

    const checkPermissions = async () => {
      // 先检查是否有麦克风、摄像头的权限
      const result = (await livePusher.checkMediaDevicePermission({
        audio: true,
        video: true,
      })) ?? {
        audio: false,
        video: false,
      };
      logger.reportInfo(EMsgid.MEDIA_DEVICE_PERMISSION, result);
      setMediaDevicePermission(result);
    };
    checkPermissions();

    return () => {
      livePush.destroyInstance('alivc');
    };
  }, []);

  // 处理老师的连麦邀请
  const handleReceiveInvitation = useCallback(
    (data: any) => {
      if (!supportWebRTC) {
        (interactionManager as StudentInteractionManager)?.rejectInvitation({
          ...data,
          reason: RejectInteractionInvitationReason.NotSupportWebRTC,
        });
        return;
      }

      if (!mediaDevicePermission.video && !mediaDevicePermission.audio) {
        (interactionManager as StudentInteractionManager)?.rejectInvitation({
          ...data,
          reason: RejectInteractionInvitationReason.NoDevicePermissions,
        });
        setNoDevicePermissionsModalVisible(true);
        return;
      }

      if (!interactionAllowed) {
        return;
      }

      const isNewInvitation = (
        interactionManager as StudentInteractionManager
      )?.receiveInvitation(data);
      if (!isNewInvitation) return;

      setInteractionInvitationSessionId(data.sessionId);
    },
    [
      interactionManager,
      supportWebRTC,
      interactionAllowed,
      mediaDevicePermission,
    ]
  );

  const stopPush = useCallback(async () => {
    if (!livePusher) {
      throw new Error('no livePusher');
    }

    try {
      await livePusher.destroy();
    } catch (error) {
      console.error(error);
    }
    setPushing(false);
  }, [livePusher]);

  useEffect(() => {
    if (!pusher.pushing || !livePusher) return;

    const connectionlostHandler = () => {
      toast.warning('推流异常，正在尝试重连中...');

      logger.reportInfo(EMsgid.CONNECTION_LOST);
    };

    const networkrecoveryHandler = () => {
      toast.success('推流重连成功');

      logger.reportInfo(EMsgid.NETWORK_RECOVERY);
    };

    const reconnectexhaustedHandler = () => {
      toast.warning('推流中断，请在网络恢复后刷新页面重新连麦');
      setPushing(false);

      logger.reportInfo(EMsgid.RECONNECT_EXHAUSTED);
    };

    livePusher.network.on('connectionlost', connectionlostHandler);
    livePusher.network.on('networkrecovery', networkrecoveryHandler);
    livePusher.network.on('reconnectexhausted', reconnectexhaustedHandler);

    return () => {
      livePusher.network.off('connectionlost', connectionlostHandler);
      livePusher.network.off('networkrecovery', networkrecoveryHandler);
      livePusher.network.on('reconnectexhausted', reconnectexhaustedHandler);
    };
  }, [pusher.pushing, livePusher]);

  // 处理老师的连麦邀请取消
  const handleInvitationCanceled = useCallback(
    (data: any) => {
      (
        interactionManager as StudentInteractionManager
      )?.handleInvitationCanceled(data);
      // 如果正在启动连麦或者连麦已建立，则回退
      if (interactionStarting || interacting) {
        setInteracting(false);
        setInteractionStarting(false);
        if (pusher.pushing) {
          stopPush();
        }
      }
      setInteractionInvitationSessionId(undefined);
      toast('老师取消了连麦邀请');
    },
    [
      pusher.pushing,
      interactionStarting,
      interacting,
      interactionManager,
      stopPush,
    ]
  );

  // 处理连麦申请被拒绝
  const handleApplicationRejected = useCallback(
    (data: any) => {
      const { full = false, interactionAllowed = true } = data;
      (
        interactionManager as StudentInteractionManager
      )?.handleApplicationRejected(data);
      if (full) {
        toast('连麦人数已满，请稍后尝试');
      } else if (!interactionAllowed) {
        toast('申请已取消，教师开启禁止连麦申请');
      } else {
        toast('连麦申请未通过');
      }
    },
    [interactionManager]
  );

  // 处理老师结束了连麦
  const handleTeacherEndInteraction = useCallback(() => {
    if (!interacting) return;

    setInteracting(false);
    toast('老师结束了与你的通话');
  }, [interacting]);

  // 学生端发起结束连麦，老师端允许后执行结束连麦
  const doEndInteraction = useCallback(
    (data: any) => {
      (
        interactionManager as StudentInteractionManager
      )?.handleEndingInteractionAllowed(data);

      setInteracting(false);
      toast('连麦已结束');
    },
    [interactionManager]
  );

  // 处理老师端设置「允许连麦」
  const handleInteractionAllowed = (data: any) => {
    const { allowed } = data;
    setInteractionAllowed(allowed);
    toast(allowed ? '教师已开启连麦申请' : '教师已禁止连麦申请');
  };

  // 处理老师控制其摄像头开关
  const handleCameraControl = useCallback(
    (data: any) => {
      const isValidCommand = (
        interactionManager as StudentInteractionManager
      )?.handleCameraControl(data);
      if (isValidCommand) {
        const to = data.turnOn;
        setControlledCameraOpened(to);
        if (camera.enable !== to) {
          setCameraControlling(true);
          setCameraEnable(to);
        }
      }
    },
    [interactionManager, camera]
  );

  // 处理老师控制其麦克风开关
  const handleMicControl = useCallback(
    (data?: any) => {
      const isValidCommand = (
        interactionManager as StudentInteractionManager
      )?.handleMicControl(data);
      if (isValidCommand) {
        const to = data.turnOn;
        setControlledMicOpened(to);
        if (microphone.enable !== to) {
          setMicrophoneControlling(true);
          setMicrophoneEnable(to);
        }
      }
    },
    [interactionManager, microphone]
  );

  const handleAllMicMuted = useCallback(
    (muted = true) => {
      toast(muted ? '老师已开启全员静音' : '老师已取消全员静音');
      setControlledMicOpened(!muted);
      setAllMicMuted(muted);

      if (interacting && muted) {
        setMicrophoneControlling(true);
        setMicrophoneEnable(false);
      }
    },
    [interacting]
  );

  const handleReceivedMessage = useCallback(
    (eventData: any) => {
      const { type, data, senderId } = eventData || {};

      if (getEnumKey(CustomMessageTypes, type)) {
        console.log(
          `${formatTime(new Date())} [StudentInteraction] Receive Message: `,
          `\ntype: ${getEnumKey(CustomMessageTypes, type)}`,
          data
        );
      }

      switch (type) {
        case CustomMessageTypes.InteractionInvitation:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            // 处理老师的连麦邀请
            handleReceiveInvitation(data);
          }
          break;

        case CustomMessageTypes.CancelInteractionInvitation:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            handleInvitationCanceled(data);
          }
          break;

        case CustomMessageTypes.AcceptedInteractionApplication:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            (
              interactionManager as StudentInteractionManager
            )?.handleApplicationAccepted(data);
          }
          break;

        case CustomMessageTypes.RejectedInteractionApplication:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            handleApplicationRejected(data);
          }
          break;

        case CustomMessageTypes.TeacherEndInteraction:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            handleTeacherEndInteraction();
          }
          break;
        case CustomMessageTypes.TeacherEndAllInteraction:
          if (senderId === teacherId && senderId !== userInfo?.userId) {
            handleTeacherEndInteraction();
          }
          break;
        case CustomMessageTypes.StudentEndInteractionAllowed:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            doEndInteraction(data);
          }
          break;
        case CustomMessageTypes.InteractionAllowed:
          if (senderId === teacherId && senderId !== userInfo?.userId) {
            handleInteractionAllowed(data);
          }
          break;
        case CustomMessageTypes.ToggleCamera:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            handleCameraControl(data);
          }
          break;
        case CustomMessageTypes.ToggleMic:
          if (
            senderId === teacherId &&
            senderId !== userInfo?.userId &&
            data.studentId === userInfo?.userId
          ) {
            handleMicControl(data);
          }
          break;
        case CustomMessageTypes.AllMicMuted:
          if (senderId === teacherId && senderId !== userInfo?.userId) {
            handleAllMicMuted(data.muted);
          }
          break;
        case CustomMessageTypes.ClassReset:
          if (senderId === teacherId && senderId !== userInfo?.userId) {
            setInteracting(false);
          }
          break;
        default:
          break;
      }
    },
    [
      userInfo,
      teacherId,
      interactionManager,
      handleReceiveInvitation,
      handleInvitationCanceled,
      handleApplicationRejected,
      handleTeacherEndInteraction,
      doEndInteraction,
      handleInteractionAllowed,
      handleCameraControl,
      handleMicControl,
      handleAllMicMuted,
    ]
  );

  useEffect(() => {
    if (supportWebRTC) {
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
    }
  }, [supportWebRTC, handleReceivedMessage]);

  const initLivePusher = useCallback(async () => {
    const { rtcPushUrl } = linkInfo ?? {};
    if (!rtcPushUrl) {
      throw new Error('no rtcPushUrl');
    }
    if (!livePusher) {
      throw new Error('no livePusher');
    }

    const enableVideo =
      // 无 deviceId 为初始化状态，默认开启；否则以 enable 为准
      (camera.enable || camera.deviceId === undefined) &&
      controlledCameraOpened &&
      mediaDevicePermission.video;

    const enableAudio =
      // 无 deviceId 为初始化状态，默认开启；否则以 enable 为准
      (microphone.enable || microphone.deviceId === undefined) &&
      controlledMicOpened &&
      mediaDevicePermission.audio;

    // 初始化对应的推流
    await livePusher.init({
      video: enableVideo,
      audio: enableAudio,
    });

    await livePusher.startPush(rtcPushUrl);
    setPushing(true);
  }, [
    livePusher,
    mediaDevicePermission,
    controlledCameraOpened,
    controlledMicOpened,
    linkInfo,
    microphone,
    camera,
  ]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.interactionStarting,
      async (val, prevVal) => {
        if (val && !prevVal) {
          await initLivePusher();
          // 在连麦启动完成之前，老师端可能会撤销连麦邀请，导致 interactionStarting = false
          const { interactionStarting } = useClassroomStore.getState();
          if (interactionStarting) {
            setInteracting(true);
          }
        }
      }
    );
    return sub;
  }, [initLivePusher]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.interacting,
      async (val, prevVal) => {
        if (val && !prevVal) {
          const beingInvited = !!interactionInvitationSessionId;
          if (beingInvited || applicationAccepted) {
            const { rtcPullUrl } = linkInfo ?? {};
            const { userId: studentId = '' } = userInfo ?? {};
            const {
              isAudioPublishing: micOpened,
              isCameraPublishing, // 摄像头不可用，因为有占位图，所以流中也有 camera track
            } = livePusher?.getPublishingStatus() ?? {};
            const cameraOpened =
              isCameraPublishing &&
              mediaDevicePermission.video &&
              // 无 deviceId 为初始化状态，默认开启；否则以 enable 为准
              (camera.enable || camera.deviceId === undefined);
            if (beingInvited) {
              (
                interactionManager as StudentInteractionManager
              )?.sendAcceptedResp({
                sessionId: interactionInvitationSessionId,
                studentId,
                teacherId,
                rtcPullUrl,
                micOpened,
                cameraOpened,
              });
              setInteractionInvitationSessionId(undefined);
            }

            if (applicationAccepted) {
              (interactionManager as StudentInteractionManager)?.interacting({
                studentId,
                teacherId,
                rtcPullUrl,
                micOpened,
                cameraOpened,
              });
              setApplicationAccepted(false);
            }
          }
          setInteractionStarting(false);
        }
      }
    );
    return sub;
  }, [
    camera,
    livePusher,
    mediaDevicePermission,
    teacherId,
    linkInfo,
    applicationAccepted,
    interactionInvitationSessionId,
  ]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.interacting,
      async (val, prevVal) => {
        if (!val && prevVal) {
          stopPush();
        }
      }
    );
    return sub;
  }, [stopPush]);

  const application = useCallback(() => {
    if (disabled || applicationWaiting) return;
    if (!userInfo?.userId || !teacherId) {
      toast.warning('课堂初始化异常，请退出重试');
      return;
    }
    if (!mediaDevicePermission.audio && !mediaDevicePermission.video) {
      setNoDevicePermissionsModalVisible(true);
      return;
    }

    const state = (
      interactionManager as StudentInteractionManager
    )?.application({
      studentId: userInfo?.userId,
      teacherId,
    });
    setApplicationWaiting(true);
    state.on(InteractionApplicationEvent.Accepted, () => {
      setApplicationAccepted(true);
      setApplicationWaiting(false);
      setInteractionStarting(true);
    });
    state.on(InteractionApplicationEvent.Rejected, () => {
      setApplicationWaiting(false);
    });
    state.on(InteractionApplicationEvent.Timeout, () => {
      setApplicationWaiting(false);
      toast('连麦未响应');
    });
    state.on(InteractionApplicationEvent.Cancel, () => {
      setApplicationWaiting(false);
    });
  }, [
    disabled,
    mediaDevicePermission,
    userInfo,
    teacherId,
    interactionManager,
  ]);

  const cancelApplication = useCallback(() => {
    try {
      (interactionManager as StudentInteractionManager)?.cancelApplication({
        studentId: userInfo?.userId ?? '',
        teacherId: teacherId,
      });
    } catch (error) {
      console.log(error);
    }
  }, [userInfo, teacherId, interactionManager]);

  const noticeEndingInteraction = useCallback(() => {
    const state = (
      interactionManager as StudentInteractionManager
    )?.noticeEndingInteraction({
      studentId: userInfo?.userId ?? '',
      teacherId,
    });
    state.on(StudentEndInteractionEvent.Timeout, () => {
      setDisabled(false);
    });
    state.on(StudentEndInteractionEvent.Allowed, () => {
      setInteracting(false);
      setDisabled(false);
    });
  }, [interactionManager, userInfo, teacherId]);

  const handleConfirmEndInteraction = useCallback(() => {
    setDisabled(true);
    noticeEndingInteraction();
  }, [noticeEndingInteraction]);

  const endInteraction = useCallback(() => {
    if (disabled) return;

    const dialogContent = '确定结束本次连麦吗？';
    if (UA.isPC) {
      Modal.confirm({
        title: dialogContent,
        cancelText: '取消',
        okText: '确定',
        onOk: handleConfirmEndInteraction,
      });
    } else {
      Dialog.confirm({
        content: dialogContent,
        onConfirm: handleConfirmEndInteraction,
      });
    }
  }, [disabled, applicationWaiting, userInfo, teacherId]);

  const renderComp = () => {
    if (disabled)
      return (
        <Tooltip
          title={
            !supportWebRTC
              ? '浏览器暂不支持连麦'
              : !interactionAllowed
              ? '连麦申请已禁止'
              : ''
          }
        >
          {disabledComp}
        </Tooltip>
      );
    if (applicationWaiting)
      return (
        <div className={compWrapperClassName} onClick={cancelApplication}>
          {loadingComp}
        </div>
      );
    if (interacting)
      return (
        <div className={compWrapperClassName} onClick={endInteraction}>
          {activeComp}
        </div>
      );
    return (
      <div className={compWrapperClassName} onClick={application}>
        {initialComp}
      </div>
    );
  };

  return (
    <>
      {renderComp()}
      <InteractionInvitationModal
        interactionInvitationSessionId={interactionInvitationSessionId}
        onReject={() => setInteractionInvitationSessionId(undefined)}
      />
      <NoDevicePermissionsModal
        show={noDevicePermissionsModalVisible}
        onClose={() => setNoDevicePermissionsModalVisible(false)}
      />
    </>
  );
}

export default StudentInteraction;
