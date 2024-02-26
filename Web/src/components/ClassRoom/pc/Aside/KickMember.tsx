import React, { useState, useCallback, useContext } from 'react';
import { ClassContext } from '../../ClassContext';
import toast from '@/utils/toast';
import { Modal } from 'antd';
import useClassroomStore from '../../store';
import {
  AssistantCooperationManager,
  MuteGroupOrUserEvent,
} from '../../utils/AdminCooperation';

interface KickMemberProps {
  children: React.ReactNode;
  userId: string;
  userName?: string;
  onStarted?: () => void;
  onEnded?: () => void;
}

const KickMember: React.FC<KickMemberProps> = props => {
  const { children, userId, userName, onStarted, onEnded } = props;
  const {
    classroomInfo: { teacherId, assistantId },
    isTeacher: currentUserIsTeacher,
    connectedSpectators,
    updateConnectedSpectator,
    increaseMemberListFlag,
  } = useClassroomStore(state => state);
  const { services, auiMessage, cooperationManager } = useContext(ClassContext);
  const [kicking, setKicking] = useState(false);

  const stopInteraction = useCallback(
    (kickedUserId: string) => {
      const isInteracting = connectedSpectators.find(
        ({ userId }) => userId === kickedUserId
      );
      if (isInteracting) {
        updateConnectedSpectator(kickedUserId);
      }
    },
    [connectedSpectators]
  );

  const doMuteUser = useCallback(
    async (userId: string, mute = true) => {
      try {
        if (mute) {
          await auiMessage.muteUser(userId);
        } else {
          await auiMessage.cancelMuteUser(userId);
        }
      } catch (error) {
        console.warn(`${userId}${mute ? '' : '解除'}禁言失败`);
        throw error;
      }
    },
    [auiMessage]
  );

  const muteUserProxy = useCallback(
    (userId: string, mute = true) =>
      new Promise<void>((resolve, reject) => {
        const stateMachine = (
          cooperationManager as AssistantCooperationManager
        )?.muteUser({
          userId,
          mute,
        });
        stateMachine.on(MuteGroupOrUserEvent.Responsed, (payload: any) => {
          if (payload.success === false) reject();
          resolve();
        });
        stateMachine.on(MuteGroupOrUserEvent.Timeout, () => {
          reject();
        });
      }),
    [connectedSpectators]
  );

  const muteUser = useCallback(
    (userId: string, mute = true) => {
      if (
        currentUserIsTeacher ||
        !CONFIG?.imServer?.aliyunIMV1?.enable ||
        !CONFIG?.imServer?.aliyunIMV1?.primary
      )
        return doMuteUser(userId, mute);
      /**
       * NOTE: 由于aliyunIMV1无法支持非创建者禁言，因此使用IM请求创建者处理
       * aliyunIMV1(Deprecation) 不建议开启并设置为 primary
       */
      return muteUserProxy(userId, mute);
    },
    [currentUserIsTeacher, doMuteUser, muteUserProxy]
  );

  const doKick = useCallback(async () => {
    onStarted?.();
    setKicking(true);
    try {
      await services?.kickClass(userId);
      toast.success(`${userName ?? userId} 已被移除出教室`);
      increaseMemberListFlag();
      stopInteraction(userId);
      // 移除时也需要禁言该用户，若后续支持解除黑名单，也需要解除禁言
      await muteUser(userId);
    } catch (err) {
      console.log('member kick', err);
      toast.error(`${userName ?? userId} 移除失败`);
    } finally {
      setKicking(false);
      onEnded?.();
    }
  }, [
    kicking,
    services,
    userId,
    userName,
    teacherId,
    assistantId,
    onStarted,
    onEnded,
    muteUser,
    increaseMemberListFlag,
    stopInteraction,
  ]);

  const handleKick = useCallback(() => {
    // 正在移除，或者当前用户为老师或助教，不处理
    if (kicking || userId === teacherId || userId === assistantId) return;

    Modal.confirm({
      title: `确认将成员“${userName}”移除出课堂？`,
      cancelText: '取消',
      okText: '确定',
      onOk: doKick,
    });
  }, [kicking, userName, doKick]);

  return <div onClick={handleKick}>{children}</div>;
};

export default KickMember;
