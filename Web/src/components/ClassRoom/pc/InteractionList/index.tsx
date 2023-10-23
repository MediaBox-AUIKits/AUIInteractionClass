import React, { useMemo, useContext } from 'react';
import SpeakerView from './SpeakerView';
import { ClassroomStatusEnum } from '../../types';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import { UA } from '../../utils/common';

interface IInteractionListProps {
  wrapClassName?: string;
  isTeacher?: boolean;
}

const InteractionList: React.FC<IInteractionListProps> = props => {
  const { wrapClassName, isTeacher } = props;
  const {
    pusher,
    connectedSpectators,
    classroomInfo: { teacherId, status },
    updateConnectedSpectator,
  } = useClassroomStore(state => state);
  const { userInfo } = useContext(ClassContext);

  const otherMembers = useMemo(
    () =>
      connectedSpectators.filter(({ userId }) => userId !== userInfo?.userId),
    [connectedSpectators, userInfo]
  );

  const memberList = useMemo(() => {
    if (!UA.isPC) return otherMembers;
    return otherMembers.filter(({ userId }) => userId !== teacherId);
  }, [otherMembers, teacherId]);

  const showMembers = useMemo(() => {
    if (UA.isPC) return !!otherMembers.length;
    return !!otherMembers.length;
  }, [otherMembers]);

  if (!showMembers || !pusher.pushing || status !== ClassroomStatusEnum.started)
    return null;

  return (
    <SpeakerView
      wrapClassName={wrapClassName}
      isTeacher={isTeacher}
      memberList={memberList}
      onUserLeft={updateConnectedSpectator}
    />
  );
};

export default InteractionList;
