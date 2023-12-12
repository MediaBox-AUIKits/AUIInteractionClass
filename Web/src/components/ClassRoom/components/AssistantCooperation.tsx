import React, { useEffect, useCallback, useContext } from 'react';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import useClassroomStore from '@/components/ClassRoom/store';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import { CustomMessageTypes } from '@/components/ClassRoom/types';
import { AssistantCooperationManager } from '../utils/AdminCooperation';
import { getEnumKey } from '@/utils/common';
import { formatTime } from '@/components/ClassRoom/utils/common';
import toast from '@/utils/toast';

function AssistantCooperation() {
  const { auiMessage, cooperationManager, userInfo, exit } =
    useContext(ClassContext);
  const {
    classroomInfo: { teacherId },
    setAccessibleFunctions,
    setDocsUpdateFlag,
  } = useClassroomStore(state => state);

  const isAdmin = useCallback(
    (userId: string) => userId === teacherId,
    [teacherId]
  );
  const isMe = useCallback(
    (userId: string) => userId === userInfo?.userId,
    [userInfo]
  );

  const handleReceivedMessage = useCallback(
    (eventData: any) => {
      const { type, data, senderId } = eventData || {};

      if (getEnumKey(CustomMessageTypes, type)) {
        console.log(
          `${formatTime(new Date())} [AssistantCooperation] Receive Message: `,
          `\ntype: ${getEnumKey(CustomMessageTypes, type)}`,
          data
        );
      }

      switch (type) {
        case CustomMessageTypes.SyncDocsUpdated:
          if (!isMe(senderId) && isAdmin(senderId)) {
            setDocsUpdateFlag();
          }
          break;
        case CustomMessageTypes.SyncAssistantPermissions:
          if (isAdmin(senderId) && !isMe(senderId) && data.permissions) {
            setAccessibleFunctions(data.permissions);
          }
          break;
        // 老师关闭助教功能后，助教会收到服务端触发的离开IM，助教应该离开页面；可根据业务调整
        case CustomMessageTypes.MemberLeft:
          if (isMe(data?.user_id)) {
            toast('老师已关闭助教功能');
            exit();
          }
          break;
        case CustomMessageTypes.ResponseMuteUser:
          if (isAdmin(senderId) && !isMe(senderId)) {
            (
              cooperationManager as AssistantCooperationManager
            )?.handleMuteUserResponsed(data);
          }
          break;
        case CustomMessageTypes.ResponseMuteGroup:
          if (isAdmin(senderId) && !isMe(senderId)) {
            (
              cooperationManager as AssistantCooperationManager
            )?.handleMuteGroupResponsed(data);
          }
          break;
        default:
          break;
      }
    },
    [userInfo, teacherId, cooperationManager, isAdmin, isMe]
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
  }, [handleReceivedMessage]);

  return <></>;
}

export default AssistantCooperation;
