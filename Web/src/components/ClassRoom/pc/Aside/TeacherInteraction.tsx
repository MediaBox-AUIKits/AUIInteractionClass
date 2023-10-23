import React, { useEffect, useCallback, useContext, useMemo } from 'react';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import useClassroomStore from '@/components/ClassRoom/store';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage';
import {
  CustomMessageTypes,
  MeetingInfo,
  IUserInfo,
  ISpectatorInfo,
} from '@/components/ClassRoom/types';
import { TeacherInteractionManager } from '@/components/ClassRoom/utils/InteractionManager';
import livePush from '@/components/ClassRoom/utils/LivePush';
import { getEnumKey } from '@/utils/common';
import { formatTime } from '@/components/ClassRoom/utils/common';

function TeacherInteraction() {
  const { auiMessage, interactionManager, userInfo, services } =
    useContext(ClassContext);
  const {
    pusher,
    classroomInfo,
    interactionFull,
    applyingList,
    interactionAllowed,
    updateConnectedSpectator,
    updateApplyingList,
  } = useClassroomStore(state => state);
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);

  const updateMeetingInfo = useCallback(
    async (payload: Partial<MeetingInfo>) => {
      await services?.updateMeetingInfo({
        ...payload,
      });
    },
    [services]
  );

  const updateMixTranscoding = useCallback(
    (connectedSpectators: ISpectatorInfo[]) => {
      if (connectedSpectators.length > 1) {
        livePusher.updateInteractionMembersCameraLayout(connectedSpectators);
      } else {
        livePusher.resetInteractionMembersCameraLayout();
      }
    },
    [livePusher]
  );

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.connectedSpectators,
      async (val, prevVal) => {
        const interacting = val.length > 1;
        const endInteraction = prevVal.length > 1 && val.length <= 1;

        // 结束连麦，全员信令通知早于混流（麦下学生尽早看到 teacher_camera）
        if (endInteraction) {
          await updateMeetingInfo({
            members: val,
          });
          (
            interactionManager as TeacherInteractionManager
          ).sendInteractionUpdated(val);
        }

        // 连麦中，或者无连麦
        if (interacting || endInteraction) {
          if (val.length === 0) {
            prevVal
              .filter(({ userId: _userId }) => _userId !== userInfo?.userId)
              .forEach(({ userId: _userId }) => {
                (
                  interactionManager as TeacherInteractionManager
                ).endInteraction(_userId);
              });
          }
          await updateMixTranscoding(val);
        }

        if (!endInteraction) {
          setTimeout(
            async () => {
              // 成员连麦状态变化或者连麦人数有变化
              await updateMeetingInfo({
                members: val,
              });
              (
                interactionManager as TeacherInteractionManager
              ).sendInteractionUpdated(val);
            },
            // 启动连麦，混流早于全员信令通知（麦下学生稍晚一些收到通知，尽可能在切到摄像头混流时看到混流后的效果）；
            // 开始上课，也需要稍作等待才可以拉到 teacher_camera & teacher_shareScreen
            1500
          );
        }
      }
    );
    return sub;
  }, [userInfo, interactionManager, updateMeetingInfo, updateMixTranscoding]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.interactionAllowed,
      async (val, prevVal) => {
        if (val !== prevVal) {
          (interactionManager as TeacherInteractionManager).interactionAllowed(
            val
          );
          await updateMeetingInfo({
            interactionAllowed: val,
          });
          if (!val && prevVal) {
            applyingList.forEach(({ userId }) => {
              (
                interactionManager as TeacherInteractionManager
              ).rejectApplication(userId, {
                interactionAllowed: val,
              });
              updateApplyingList(userId);
            });
          }
        }
      }
    );
    return sub;
  }, [interactionManager, applyingList, updateMeetingInfo, updateApplyingList]);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.allMicMuted,
      async (val, prevVal) => {
        if (val !== prevVal) {
          (interactionManager as TeacherInteractionManager).allMicMuted(val);
          await updateMeetingInfo({
            allMute: val,
          });
        }
      }
    );
    return sub;
  }, [interactionManager, updateMeetingInfo]);

  // 学生同意连麦并完成连麦
  const handleStudentAcceptedInvitation = useCallback(
    (data: any, senderInfo: any) => {
      try {
        (
          interactionManager as TeacherInteractionManager
        ).handleInvitationAccepted(data);
      } catch (error) {
        console.log(error);
        return;
      }
      const userInfo: ISpectatorInfo = {
        ...senderInfo,
        ...data,
      };
      updateApplyingList(userInfo.userId);
      updateConnectedSpectator(userInfo.userId, userInfo);
    },
    [interactionManager]
  );

  // 学生举手通过并完成连麦
  const handleApplicationSucceed = (data: any, senderInfo: any) => {
    const userInfo: ISpectatorInfo = {
      ...senderInfo,
      ...data,
    };
    updateApplyingList(userInfo.userId);
    updateConnectedSpectator(userInfo.userId, userInfo);
    (interactionManager as TeacherInteractionManager).handleApplicationSucceed(
      data
    );
  };

  // 处理学生的连麦申请
  const handleReceiveApplication = useCallback(
    (data: any, senderInfo: any) => {
      const isNewApplication = (
        interactionManager as TeacherInteractionManager
      ).receiveApplication(data, {
        full: interactionFull,
        interactionAllowed,
      });
      if (!isNewApplication) return;

      const userInfo: IUserInfo = {
        ...senderInfo,
        userName: senderInfo.userNick,
      };
      updateApplyingList(userInfo.userId, userInfo);
    },
    [interactionManager, interactionFull, interactionAllowed]
  );

  // 处理学生的连麦申请取消
  const handleApplicationCanceled = useCallback(
    (data: any) => {
      (
        interactionManager as TeacherInteractionManager
      ).handleApplicationCanceled(data);
      updateApplyingList(data.studentId);
    },
    [interactionManager]
  );

  // 处理收到学生的下麦通知
  const handleEndInteractionNotice = useCallback(
    async (data: any) => {
      const { studentId, teacherId, sessionId } = data;
      updateConnectedSpectator(studentId);
      (interactionManager as TeacherInteractionManager).allowEndInteraction({
        studentId,
        teacherId,
        sessionId,
      });
    },
    [interactionManager]
  );

  const handleReceivedMessage = useCallback(
    (eventData: any) => {
      const { type, data, senderId, senderInfo } = eventData || {};

      if (getEnumKey(CustomMessageTypes, type)) {
        console.log(
          `${formatTime(new Date())} [TeacherInteraction] Receive Message: `,
          `\ntype: ${getEnumKey(CustomMessageTypes, type)}`,
          data
        );
      }

      switch (type) {
        case CustomMessageTypes.AcceptedInteractionInvitation:
          if (
            senderId !== classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            handleStudentAcceptedInvitation(data, senderInfo);
          }
          break;

        case CustomMessageTypes.RejectedInteractionInvitation:
          if (
            senderId !== classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            (
              interactionManager as TeacherInteractionManager
            ).handleInvitationRejected(data);
          }
          break;
        case CustomMessageTypes.InteractionApplication:
          if (
            senderId !== classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            handleReceiveApplication(data, senderInfo);
          }
          break;
        case CustomMessageTypes.CancelInteractionApplication:
          if (
            senderId !== classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            handleApplicationCanceled(data);
          }
          break;
        case CustomMessageTypes.InteractionApplicationSucceed:
          if (
            senderId !== classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            handleApplicationSucceed(data, senderInfo);
          }
          break;
        case CustomMessageTypes.StudentEndInteraction:
          if (
            senderId !== classroomInfo.teacherId &&
            senderId !== userInfo?.userId
          ) {
            handleEndInteractionNotice(data);
          }
          break;
        case CustomMessageTypes.MicChanged:
          if (senderId !== userInfo?.userId) {
            const { turnOn: micOpened = true, studentId: userId } = data;
            updateConnectedSpectator(
              userId,
              {
                micOpened,
              },
              true
            );
          }
          break;
        case CustomMessageTypes.CameraChanged:
          if (senderId !== userInfo?.userId) {
            const { turnOn: cameraOpened = true, studentId: userId } = data;
            updateConnectedSpectator(
              userId,
              {
                cameraOpened,
              },
              true
            );
          }
          break;
        case CustomMessageTypes.ToggleCameraAnswered:
          if (senderId !== userInfo?.userId) {
            (
              interactionManager as TeacherInteractionManager
            ).handleToggleCameraAnswered(data);
          }
          break;
        case CustomMessageTypes.ToggleMicAnswered:
          if (senderId !== userInfo?.userId) {
            (
              interactionManager as TeacherInteractionManager
            ).handleToggleMicAnswered(data);
          }
          break;
        default:
          break;
      }
    },
    [
      userInfo,
      classroomInfo,
      interactionManager,
      handleStudentAcceptedInvitation,
      handleReceiveApplication,
      handleApplicationCanceled,
      handleApplicationSucceed,
      handleEndInteractionNotice,
    ]
  );

  useEffect(() => {
    if (pusher.pushing) {
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
  }, [handleReceivedMessage, pusher]);

  return <></>;
}

export default TeacherInteraction;
