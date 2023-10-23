import React, { useContext, useMemo, useState, useCallback } from 'react';
import classNames from 'classnames';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import styles from './MemberItem.less';
import toast from '@/utils/toast';

export const ControlsContext = React.createContext<{
  userId: string;
  isTeacher: boolean;
  kicking: boolean;
  userName?: string;
  userNick?: string;
  onKick: () => void;
}>({
  userId: '',
  isTeacher: false,
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
  const { teacherId } = useClassroomStore(state => state.classroomInfo);
  const { connectedSpectators, updateConnectedSpectator } = useClassroomStore(
    state => state
  );
  const { services, auiMessage } = useContext(ClassContext);
  const [kicking, setKicking] = useState(false);

  const isTeacher = useMemo(() => {
    return !!userId && userId === teacherId;
  }, [userId, teacherId]);

  const inactive = useMemo(
    () => !isTeacher && notOnline,
    [notOnline, isTeacher]
  );

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

  const handleKick = useCallback(() => {
    if (kicking) {
      return;
    }
    setKicking(true);
    services
      ?.kickClass(userId)
      .then(() => {
        const { increaseMemberListFlag } = useClassroomStore.getState();
        toast.success(`${userName} 已被移除出教室`);
        increaseMemberListFlag();
        stopInteraction(userId);
        // 移除时也需要禁言该用户，若后续支持解除黑名单，也需要解除禁言
        auiMessage
          .muteUser(userId)
          .then(() => {})
          .catch(() => {
            console.warn(`${userId}禁言失败`);
          });
      })
      .catch(err => {
        console.log('member kick', err);
        toast.error(`${userName} 移除失败`);
      })
      .finally(() => {
        setKicking(false);
      });
  }, [stopInteraction]);

  const renderSubInfo = () => {
    if (isTeacher || subInfo) {
      return (
        <div className={styles['member-item__info__sub']}>
          {isTeacher ? (
            <span className={styles['member-item__info__teacher']}>
              老师(我)
            </span>
          ) : (
            subInfo
          )}
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
