import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Modal } from 'antd';
import { Dialog } from 'antd-mobile';
import { StudentInteractionManager } from '@/components/ClassRoom/utils/InteractionManager';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import useClassroomStore from '@/components/ClassRoom/store';
import { UA } from '@/utils/common';

interface IProps {
  interactionInvitationSessionId?: string;
  onReject: () => void;
}

function InteractionInvitation(props: IProps) {
  const { interactionInvitationSessionId, onReject } = props;
  const { interactionManager, userInfo } = useContext(ClassContext);
  const { classroomInfo, setInteractionStarting } = useClassroomStore(
    state => state
  );

  const [visible, setVisible] = useState(!!interactionInvitationSessionId);

  useEffect(() => {
    setVisible(!!interactionInvitationSessionId);
  }, [interactionInvitationSessionId]);

  const handleAccept = () => {
    setInteractionStarting(true);
    setVisible(false);
  };

  const handleReject = useCallback(() => {
    if (
      !userInfo?.userId ||
      !classroomInfo.teacherId ||
      !interactionInvitationSessionId
    ) {
      setVisible(false);
      return;
    }
    (interactionManager as StudentInteractionManager)?.rejectInvitation({
      sessionId: interactionInvitationSessionId,
      studentId: userInfo?.userId,
      teacherId: classroomInfo.teacherId,
    });
    onReject?.();
    setVisible(false);
  }, [
    userInfo,
    classroomInfo,
    interactionInvitationSessionId,
    interactionManager,
  ]);

  const dialogContent = '教师邀请你参与通话';

  if (UA.isPC) {
    return (
      <Modal
        open={visible}
        onOk={() => handleAccept()}
        onCancel={() => handleReject()}
        okText="接受"
        cancelText="拒绝"
      >
        {dialogContent}
      </Modal>
    );
  }
  return (
    <Dialog
      visible={visible}
      content={dialogContent}
      actions={[
        [
          {
            key: 'cancel',
            text: '拒绝',
            onClick: () => handleReject(),
          },
          {
            key: 'confirm',
            text: '接受',
            onClick: () => handleAccept(),
          },
        ],
      ]}
    />
  );
}

export default InteractionInvitation;
