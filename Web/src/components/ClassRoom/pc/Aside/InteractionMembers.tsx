/**
 * 连麦成员管理
 */
import React from 'react';
import ApplyingList from './ApplyingList';
import InteractingList from './InteractingList';
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
      <ApplyingList />
      {showInteractingList ? (
        <InteractingList
          className={classNames({
            [styles['has-border-top']]: applyingList.length,
          })}
        />
      ) : null}
    </div>
  );
};

export default InteractionMembers;
