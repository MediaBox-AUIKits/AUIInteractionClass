import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Dropdown, Popover } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import KickMember from '../KickMember';
import useClassroomStore from '@/components/ClassRoom/store';
import {
  ClassroomFunction,
  ClassroomModeEnum,
  InteractionInvitationUpdateType,
} from '@/components/ClassRoom/types';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { ControlsContext } from '../MemberItem';
import { AsideContext } from '../index';
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
  const { canManageInteraction, canKickMember } = useContext(AsideContext);
  const { isTeacher, isAssistant, userId, userName, userNick } =
    useContext(ControlsContext);
  const {
    isAssistant: currentUserIsAssistant,
    isTeacher: currentUserIsTeacher,
    classroomInfo: { mode },
    asstAccessibleFunctions,
  } = useClassroomStore(state => state);
  const {
    pusher,
    interactionFull,
    interactionAllowed,
    updateConnectedSpectator,
    updateInteractionInvitationUsers,
  } = useClassroomStore.getState();
  const [tipOpen, setTipOpen] = useState(false);
  const [kicking, setKicking] = useState(false);

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
    if (!canManageInteraction) return;

    updateInteractionInvitationUsers(
      InteractionInvitationUpdateType.Add,
      userId
    );
    doInvite(userId);
  }, [canManageInteraction, doInvite, userId]);

  const doCancel = useCallback(
    (studentId: string) => {
      (interactionManager as TeacherInteractionManager)?.cancelInvitation(
        studentId
      );
    },
    [interactionManager]
  );

  const cancelInvite = useCallback(() => {
    if (!canManageInteraction) return;

    updateInteractionInvitationUsers(
      InteractionInvitationUpdateType.Remove,
      userId
    );
    doCancel(userId);
  }, [canManageInteraction, userId, doCancel]);

  // 下麦
  const endInteraction = useCallback(() => {
    if (!canManageInteraction) return;

    (interactionManager as TeacherInteractionManager)?.endInteraction(userId);
    updateConnectedSpectator(userId);
  }, [canManageInteraction, userId, interactionManager]);

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
    endInteraction,
  ]);

  const isSelfItem = useMemo(
    () =>
      isTeacher
        ? currentUserIsTeacher
        : isAssistant
        ? currentUserIsAssistant
        : false,
    [currentUserIsAssistant, currentUserIsTeacher, isTeacher, isAssistant]
  );
  const isAdminItem = useMemo(
    () => isTeacher || isAssistant,
    [isTeacher, isAssistant]
  );

  const renderInteractionButton = useCallback(() => {
    if (
      isTeacher ||
      (isAssistant &&
        !asstAccessibleFunctions.includes(ClassroomFunction.JoinInteraction)) ||
      !canManageInteraction
    )
      return null;

    return (
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
    );
  }, [
    tipOpen,
    btnParams,
    canManageInteraction,
    isTeacher,
    isAssistant,
    asstAccessibleFunctions,
  ]);

  if (isSelfItem || notOnline) {
    return <div className={styles['member-controls']}></div>;
  }

  // 大班课仅有移除成员功能
  if (mode === ClassroomModeEnum.Open) {
    // 不可移除管理员
    return canKickMember && !isAdminItem ? (
      <div className={styles['member-controls']}>
        <KickMember
          userId={userId}
          userName={userName ?? userNick ?? userId}
          onStarted={() => setKicking(true)}
          onEnded={() => setKicking(false)}
        >
          {/* 移除教室 */}
          <Button
            size="small"
            type="primary"
            className={styles['item-controls__btn']}
            loading={kicking}
          >
            移除
          </Button>
        </KickMember>
      </div>
    ) : null;
  }

  return (
    <div className={styles['member-controls']}>
      {/* 不可移除管理员 */}
      {canKickMember && !isAdminItem ? (
        <Dropdown
          menu={{
            items: [
              {
                label: (
                  <KickMember
                    userId={userId}
                    userName={userName ?? userNick ?? userId}
                    onStarted={() => setKicking(true)}
                    onEnded={() => setKicking(false)}
                  >
                    移除教室
                  </KickMember>
                ),
                key: 'kick',
                disabled: kicking,
              },
            ],
          }}
          arrow
          placement="bottomRight"
        >
          <MoreOutlined className={styles['item-controls__more']} />
        </Dropdown>
      ) : null}
      {renderInteractionButton()}
    </div>
  );
};

export default MemberControls;
