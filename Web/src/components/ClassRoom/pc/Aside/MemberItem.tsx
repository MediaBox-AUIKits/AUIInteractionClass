import React, { useContext, useMemo, useState, useCallback } from 'react';
import classNames from 'classnames';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import { MemberListContext } from './index';
import styles from './MemberItem.less';
import toast from '@/utils/toast';
import {
  AssistantCooperationManager,
  MuteGroupOrUserEvent,
} from '../../utils/AdminCooperation';

export const ControlsContext = React.createContext<{
  userId: string;
  isTeacher: boolean;
  isAssistant: boolean;
  kicking: boolean;
  userName?: string;
  userNick?: string;
  onKick: () => void;
}>({
  userId: '',
  isTeacher: false,
  isAssistant: false,
  userName: '',
  userNick: '',
  kicking: false,
  onKick: () => {},
});

interface IMemberItemProps {
  userInfo: {
    userId: string;
    userName?: string;
    userNick?: string;
    userAvatar?: string;
    [x: string]: any;
  };
  notOnline?: boolean;
  subInfo?: React.ReactNode;
  controls?: React.ReactNode;
}

const MemberItem: React.FC<IMemberItemProps> = props => {
  const { notOnline = false, userInfo, controls, subInfo } = props;
  const { userId, userName, userNick, userAvatar } = userInfo;
  const {
    isAssistant: currentUserIsAssistant,
    isTeacher: currentUserIsTeacher,
    classroomInfo: { teacherId, assistantId },
    connectedSpectators,
    updateConnectedSpectator,
  } = useClassroomStore(state => state);
  const {
    userInfo: currentUserInfo,
    services,
    auiMessage,
    cooperationManager,
  } = useContext(ClassContext);
  const { canKickMember } = useContext(MemberListContext);
  const [kicking, setKicking] = useState(false);

  const isTeacher = useMemo(() => userId === teacherId, [userId, teacherId]);
  const isAssistant = useMemo(
    () => userId === assistantId,
    [userId, assistantId]
  );
  const isSelf = useMemo(
    () => userId === currentUserInfo?.userId,
    [currentUserInfo, userId]
  );
  const inactive = useMemo(() => {
    if (currentUserIsTeacher) return !isTeacher && notOnline;
    if (currentUserIsAssistant) return !isAssistant && notOnline;
  }, [
    notOnline,
    isTeacher,
    isAssistant,
    currentUserIsAssistant,
    currentUserIsTeacher,
  ]);

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
      if (currentUserIsTeacher) return doMuteUser(userId, mute);
      // 由于旧阿里云IM无法支持非创建者禁言，因此使用IM请求创建者处理
      return muteUserProxy(userId, mute);
    },
    [currentUserIsTeacher, doMuteUser, muteUserProxy]
  );

  const handleKick = useCallback(async () => {
    if (kicking || !canKickMember) {
      return;
    }
    setKicking(true);
    try {
      await services?.kickClass(userId);
      const { increaseMemberListFlag } = useClassroomStore.getState();
      toast.success(`${userName} 已被移除出教室`);
      increaseMemberListFlag();
      stopInteraction(userId);
      // 移除时也需要禁言该用户，若后续支持解除黑名单，也需要解除禁言
      await muteUser(userId);
    } catch (err) {
      console.log('member kick', err);
      toast.error(`${userName} 移除失败`);
    } finally {
      setKicking(false);
    }
  }, [canKickMember, kicking, muteUser]);

  const renderAdminTag = () => {
    if (isTeacher)
      return (
        <span className={styles['member-item__info__teacher']}>
          老师{isSelf ? '(我)' : null}
        </span>
      );
    if (isAssistant)
      return (
        <span className={styles['member-item__info__assistant']}>
          助教{isSelf ? '(我)' : null}
        </span>
      );
  };

  const renderSubInfo = () => {
    if (isTeacher || isAssistant || subInfo) {
      return (
        <div className={styles['member-item__info__sub']}>
          {renderAdminTag() ?? subInfo}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={classNames(styles['member-item'], { inactive })}>
      <Avatar
        size={40}
        icon={<UserOutlined />}
        src={userAvatar ?? ''}
        className={styles['member-item__avatar']}
      />
      <div className={styles['member-item__info']}>
        <div className={styles['member-item__info__main']}>
          {userName ?? userNick}
        </div>
        {renderSubInfo()}
      </div>
      {controls ? (
        <ControlsContext.Provider
          value={{
            userId,
            isTeacher,
            isAssistant,
            kicking,
            userName,
            userNick,
            onKick: handleKick,
          }}
        >
          {controls}
        </ControlsContext.Provider>
      ) : null}
    </div>
  );
};

export default MemberItem;
