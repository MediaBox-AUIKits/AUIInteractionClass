import React, { useEffect, useCallback, useContext } from 'react';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import useClassroomStore from '@/components/ClassRoom/store';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import { CustomMessageTypes } from '@/components/ClassRoom/types';
import {
  TeacherCooperationManager,
  CooperationIMData,
} from '../utils/AdminCooperation';
import { getEnumKey } from '@/utils/common';
import { formatTime } from '@/components/ClassRoom/utils/common';

function TeacherCooperation() {
  const { auiMessage, cooperationManager, userInfo } = useContext(ClassContext);
  const {
    pusher,
    classroomInfo: { assistantId },
    setDocsUpdateFlag,
  } = useClassroomStore(state => state);

  const isAdmin = useCallback(
    (userId: string) => userId === assistantId,
    [assistantId]
  );
  const isMe = useCallback(
    (userId: string) => userId === userInfo?.userId,
    [userInfo]
  );

  const muteUser = useCallback(
    async (userId: string, mute = true) => {
      try {
        if (mute) {
          await auiMessage.muteUser(userId);
        } else {
          await auiMessage.cancelMuteUser(userId);
        }
      } catch (error) {
        console.warn(`${userId}禁言失败`);
        throw error;
      }
    },
    [auiMessage]
  );

  const handleMuteUserReq = useCallback(
    async (data: CooperationIMData) => {
      (cooperationManager as TeacherCooperationManager)?.receiveMuteUserReq(
        data
      );
      if (!data?.userId) {
        console.error(
          '[TeacherCooperation] handleMuteUserReq: failed, no userId received.'
        );
        (cooperationManager as TeacherCooperationManager)?.muteUserDone(
          false,
          data?.userId
        );
      }
      try {
        await muteUser(data?.userId, data?.mute);
        (cooperationManager as TeacherCooperationManager)?.muteUserDone(
          true,
          data?.userId
        );
      } catch (error) {
        console.log(error);
      }
    },
    [cooperationManager, muteUser]
  );

  const muteGroup = useCallback(
    async (mute = true) => {
      try {
        if (mute) {
          await auiMessage.muteGroup();
        } else {
          await auiMessage.cancelMuteGroup();
        }
      } catch (error) {
        console.warn('群组禁言失败');
        throw error;
      }
    },
    [auiMessage]
  );

  const handleMuteGroupReq = useCallback(
    async (data: CooperationIMData) => {
      (cooperationManager as TeacherCooperationManager)?.receiveMuteGroupReq(
        data
      );
      try {
        await muteGroup(data?.mute);
        (cooperationManager as TeacherCooperationManager)?.muteGroupDone(true);
      } catch (error) {
        console.log(error);
      }
    },
    [cooperationManager, muteGroup]
  );

  const handleReceivedMessage = useCallback(
    (eventData: any) => {
      const { type, data, senderId } = eventData || {};

      if (getEnumKey(CustomMessageTypes, type)) {
        console.log(
          `${formatTime(new Date())} [TeacherCooperation] Receive Message: `,
          `\ntype: ${getEnumKey(CustomMessageTypes, type)}`,
          senderId,
          data
        );
      }

      switch (type) {
        case CustomMessageTypes.SyncDocsUpdated:
          if (!isMe(senderId) && isAdmin(senderId)) {
            setDocsUpdateFlag();
          }
          break;
        case CustomMessageTypes.RequestMuteUser:
          if (!isMe(senderId) && isAdmin(senderId)) {
            handleMuteUserReq(data);
          }
          break;
        case CustomMessageTypes.RequestMuteGroup:
          if (!isMe(senderId) && isAdmin(senderId)) {
            handleMuteGroupReq(data);
          }
          break;
        default:
          break;
      }
    },
    [
      userInfo,
      assistantId,
      isAdmin,
      isMe,
      handleMuteUserReq,
      handleMuteGroupReq,
    ]
  );

  useEffect(() => {
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
  }, [handleReceivedMessage, pusher]);

  return <></>;
}

export default TeacherCooperation;
