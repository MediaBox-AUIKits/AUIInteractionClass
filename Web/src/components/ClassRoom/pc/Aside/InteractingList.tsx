/**
 * 连麦中用户管理
 */
import React from 'react';
import MemberItem from './MemberItem';
import InteractingControls from './ItemControls/InteractingControls';
import useClassroomStore from '../../store';

interface InteractingListProps {
  className?: string;
}

const InteractingList: React.FC<InteractingListProps> = ({
  className = '',
}: InteractingListProps) => {
  const { connectedSpectators } = useClassroomStore(state => state);

  return (
    <div className={className}>
      {connectedSpectators.map(item => (
        <MemberItem
          key={item.userId}
          userInfo={item}
          controls={<InteractingControls {...item} />}
        />
      ))}
    </div>
  );
};

export default InteractingList;
