import React, { useContext, useMemo } from 'react';
import classNames from 'classnames';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import styles from './MemberItem.less';

export const ControlsContext = React.createContext<{
  userId: string;
  isTeacher: boolean;
  isAssistant: boolean;
  userName?: string;
  userNick?: string;
}>({
  userId: '',
  isTeacher: false,
  isAssistant: false,
  userName: '',
  userNick: '',
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
  } = useClassroomStore(state => state);
  const { userInfo: currentUserInfo } = useContext(ClassContext);

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
            userName,
            userNick,
          }}
        >
          {controls}
        </ControlsContext.Provider>
      ) : null}
    </div>
  );
};

export default MemberItem;
