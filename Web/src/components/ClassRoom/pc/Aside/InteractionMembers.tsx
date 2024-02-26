/**
 * 连麦成员管理
 */
import React from 'react';
import MemberItem from './MemberItem';
import InteractingControls from './ItemControls/InteractingControls';
import useClassroomStore from '../../store';
import EmptyBlock from '../../components/EmptyBlock';
import styles from './InteractionMembers.less';
import classNames from 'classnames';

const InteractionMembers: React.FC = () => {
  const { connectedSpectators, applyingList } = useClassroomStore(
    state => state
  );
  const showInteractingList = connectedSpectators.length > 1;

  if (!connectedSpectators.length && !applyingList.length) {
    return (
      <EmptyBlock className={styles['interaction-members__empty']} text="" />
    );
  }

  return (
    <div className={styles['interaction-members__wrap']}>
      {showInteractingList ? (
        <div
          className={classNames({
            [styles['has-border-top']]: applyingList.length,
          })}
        >
          {connectedSpectators.map(item => (
            <MemberItem
              key={item.userId}
              userInfo={item}
              controls={<InteractingControls {...item} />}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default InteractionMembers;
