import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Dropdown, Popover } from 'antd';
import type { MenuProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import useClassroomStore from '@/components/ClassRoom/store';
import {
  ClassroomModeEnum,
  InteractionInvitationUpdateType,
} from '@/components/ClassRoom/types';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { ControlsContext } from '../MemberItem';
import {
  TeacherInteractionManager,
  InteractionInvitationEvent,
  InteractionInvitationState,
  InteractionEventPayload,
  RejectInteractionInvitationReason,
} from '@/components/ClassRoom/utils/InteractionManager';
import styles from './styles.less';
import toast from '@/utils/toast';

interface IMemberControlsProps {
  notOnline: boolean; // 该用户是否在线
  inviting: boolean; // 该用户被邀请连麦中
  isApplying: boolean; // 该用户是否正在申请连麦
  isConnected: boolean; // 该用户是否已连麦
}

const MemberControls: React.FC<IMemberControlsProps> = props => {
  const { notOnline, inviting, isApplying, isConnected } = props;
  const { interactionManager } = useContext(ClassContext);
  const { isTeacher, userId, userName, userNick, kicking, onKick } =
    useContext(ControlsContext);
  const { mode } = useClassroomStore(state => state.classroomInfo);
  const {
    pusher,
    interactionFull,
    interactionAllowed,
    updateConnectedSpectator,
    updateInteractionInvitationUsers,
  } = useClassroomStore.getState();
  const [tipOpen, setTipOpen] = useState(false);

  const doInvite = useCallback(
    (studentId: string) => {
      const state = (interactionManager as TeacherInteractionManager)?.invite(
        studentId
      );

      state.on(InteractionInvitationEvent.Accepted, () => {
        updateInteractionInvitationUsers(
          InteractionInvitationUpdateType.Remove,
          studentId
        );
      });
      state.on(InteractionInvitationEvent.Timeout, () => {
        toast(`${userName ?? userNick ?? userId}未应答`);
        updateInteractionInvitationUsers(
          InteractionInvitationUpdateType.Remove,
          studentId
        );
      });
      state.on(
        InteractionInvitationEvent.Rejected,
        (payload: InteractionEventPayload<InteractionInvitationState>) => {
          const { reason } = payload;
          const name = userName ?? userNick ?? userId;
          if (
            reason === RejectInteractionInvitationReason.NoDevicePermissions ||
            reason === RejectInteractionInvitationReason.NotSupportWebRTC
          ) {
            toast.error(`${name}连麦失败`);
          } else {
            toast(`${name}已拒绝`);
          }
          updateInteractionInvitationUsers(
            InteractionInvitationUpdateType.Remove,
            studentId
          );
        }
      );
      state.on(InteractionInvitationEvent.Cancel, () => {
        updateInteractionInvitationUsers(
          InteractionInvitationUpdateType.Remove,
          studentId
        );
      });
    },
    [interactionManager]
  );

  const inviteStudent = useCallback(() => {
    updateInteractionInvitationUsers(
      InteractionInvitationUpdateType.Add,
      userId
    );
    doInvite(userId);
  }, [doInvite, userId]);

  const doCancel = useCallback(
    (studentId: string) => {
      (interactionManager as TeacherInteractionManager)?.cancelInvitation(
        studentId
      );
    },
    [interactionManager]
  );

  const cancelInvite = useCallback(() => {
    updateInteractionInvitationUsers(
      InteractionInvitationUpdateType.Remove,
      userId
    );
    doCancel(userId);
  }, [doCancel, userId]);

  // 下麦
  const endInteraction = useCallback(() => {
    (interactionManager as TeacherInteractionManager).endInteraction(userId);
    updateConnectedSpectator(userId);
  }, [userId, interactionManager]);

  const btnParams = useMemo(() => {
    const ret: {
      type?: any;
      text?: string;
      disabled: boolean;
      popTip?: string;
      onClick?: () => void;
    } = {
      type: undefined,
      text: '',
      disabled: false,
    };

    if (!inviting) {
      ret.type = 'primary';
      ret.text = '连麦';
      ret.disabled = !pusher.pushing;
      ret.onClick = inviteStudent;

      if (isConnected) {
        ret.type = undefined;
        ret.text = '下麦';
        ret.onClick = endInteraction;
      } else if (isApplying) {
        ret.disabled = true;
        ret.popTip = '该用户正在申请连麦中';
      } else if (interactionFull) {
        ret.disabled = true;
        ret.popTip = '连麦人员已满';
      } else if (!interactionAllowed) {
        ret.disabled = true;
        ret.popTip = '当前已禁止连麦';
      }
    } else {
      ret.text = '取消';
      ret.onClick = cancelInvite;
    }

    return ret;
  }, [
    inviting,
    isApplying,
    isConnected,
    pusher,
    interactionFull,
    interactionAllowed,
  ]);

  const handleMoreClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'kick') {
      onKick && onKick();
    }
  };

  if (isTeacher || notOnline) {
    return <div className={styles['member-controls']}></div>;
  }

  if (mode === ClassroomModeEnum.Open) {
    return (
      <div className={styles['member-controls']}>
        <Button
          size="small"
          type="primary"
          className={styles['item-controls__btn']}
          loading={kicking}
          onClick={onKick}
        >
          移除
        </Button>
      </div>
    );
  }

  return (
    <div className={styles['member-controls']}>
      <Dropdown
        menu={{
          items: [
            {
              label: '移除教室',
              key: 'kick',
              disabled: kicking,
            },
          ],
          onClick: handleMoreClick,
        }}
        arrow
        placement="bottomRight"
      >
        <MoreOutlined className={styles['item-controls__more']} />
      </Dropdown>

      <Popover
        content={btnParams.popTip}
        open={tipOpen}
        onOpenChange={bool => {
          setTipOpen(btnParams.disabled ? bool : false);
        }}
      >
        <Button
          size="small"
          type={btnParams.type}
          disabled={btnParams.disabled}
          onClick={btnParams.onClick}
          className={styles['item-controls__btn']}
        >
          {btnParams.text}
        </Button>
      </Popover>
    </div>
  );
};

export default MemberControls;
