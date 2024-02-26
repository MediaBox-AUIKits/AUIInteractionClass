/**
 * 申请连麦用户管理
 */
import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import ApplyingControls from './ApplyingControls';
import { IUserInfo } from '../../../types';
import useClassroomStore from '../../../store';
import styles from './index.less';

const ApplyingList: React.FC = () => {
  const { applyingList } = useClassroomStore(state => state);

  if (!applyingList.length) return;

  const MemberItem = (props: IUserInfo) => {
    const { userId, userName, userAvatar } = props;
    return (
      <div className={styles['member-item']}>
        <Avatar
          size={40}
          icon={<UserOutlined />}
          src={userAvatar ?? ''}
          className={styles['member-item__avatar']}
        />
        <div className={styles['member-item__info']}>
          <div className={styles['member-item__info__main']}>
            {userName ?? userId}
          </div>
        </div>
        <ApplyingControls userId={userId} />
      </div>
    );
  };

  return (
    <div className={styles['applying-members__wrap']}>
      {applyingList.map(item => (
        <MemberItem key={item.userId} {...item} />
      ))}
    </div>
  );
};

export default ApplyingList;
