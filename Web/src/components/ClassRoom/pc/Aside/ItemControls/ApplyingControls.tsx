import React, { useCallback, useContext, useState } from 'react';
import { Button } from 'antd';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { ControlsContext } from '../MemberItem';
import { TeacherInteractionManager } from '@/components/ClassRoom/utils/InteractionManager';
import toast from '@/utils/toast';
import styles from './styles.less';
import classNames from 'classnames';

const ApplyingControls: React.FC = () => {
  const { interactionManager } = useContext(ClassContext);
  const { userId } = useContext(ControlsContext);
  const { interactionFull, updateApplyingList } = useClassroomStore.getState();
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const reject = useCallback(() => {
    (interactionManager as TeacherInteractionManager)?.rejectApplication(
      userId
    );
    updateApplyingList(userId);
    setButtonDisabled(true);
  }, [userId, interactionManager]);

  const accept = useCallback(() => {
    if (interactionFull) {
      toast.warning('麦上人员已满');
      return;
    }
    (interactionManager as TeacherInteractionManager)?.acceptApplication(
      userId
    );
    setButtonDisabled(true);
  }, [userId, interactionManager, interactionFull]);

  return (
    <div className={styles['member-controls']}>
      <Button
        className={styles['item-controls__btn']}
        size="small"
        type="primary"
        disabled={buttonDisabled}
        onClick={accept}
      >
        同意
      </Button>
      <Button
        className={classNames(styles['item-controls__btn'], styles.mr8)}
        size="small"
        type="default"
        disabled={buttonDisabled}
        onClick={reject}
      >
        拒绝
      </Button>
    </div>
  );
};

export default ApplyingControls;
