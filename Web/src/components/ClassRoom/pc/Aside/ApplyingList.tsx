/**
 * 申请连麦用户管理
 */
import React from 'react';
import MemberItem from './MemberItem';
import ApplyingControls from './ItemControls/ApplyingControls';
import useClassroomStore from '../../store';
import styles from './InteractionMembers.less';

const ApplyingMembers: React.FC = () => {
  const { applyingList } = useClassroomStore(state => state);

  if (!applyingList.length) return;

  return (
    <div className={styles['applying-members__wrap']}>
      {applyingList.map(item => (
        <MemberItem
          key={item.userId}
          userInfo={item}
          subInfo="申请连麦中"
          controls={<ApplyingControls />}
        />
      ))}
    </div>
  );
};

export default ApplyingMembers;
