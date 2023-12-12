import InteractionManager, {
  createInteractionError,
} from './InteractionManager';
import { CustomMessageTypes, ISpectatorInfo, UserRoleEnum } from '@/types';
import {
  InteractionSession,
  InteractionInvitationState,
  InteractionInvitationEvent,
  ToggleRemoteDeviceState,
  ToggleRemoteDeviceEvent,
  InteractionManagerProps,
  InteractionIMData,
  InteractionStatus,
  ERROR,
} from './index.d';
import {
  InteractionInvitationStateMachine,
  ToggleRemoteDeviceStateMachine,
} from './StateMachine';

export default class TeacherInteractionManager extends InteractionManager {
  private pendingApplication: Map<string, InteractionIMData> = new Map();

  constructor(props: InteractionManagerProps) {
    super(props);
    this.role = UserRoleEnum.Teacher;
  }

  protected checkRole() {
    if (this.role === UserRoleEnum.Student) {
      throw createInteractionError(ERROR.ROLE_ACTION_MISMATCH);
    }
  }

  // 邀请学生连麦
  invite(studentId: string): InteractionInvitationStateMachine {
    this.checkRole();

    const type = CustomMessageTypes.InteractionInvitation;
    const session = this.getSession({ remoteUserId: studentId, type });
    if (session) {
      throw createInteractionError(ERROR.STATE_ACTION_MISMATCH, {
        type,
        studentId,
        state: session.stateMachine.state,
      });
    }

    const sessionId = this.getSessionId(type);
    const stateMachine = new InteractionInvitationStateMachine(
      InteractionInvitationState.Initial
    );

    stateMachine.on(InteractionInvitationEvent.SendInvitation, () => {
      this.sendIM(type, {
        sessionId,
        studentId,
      });
    });
    stateMachine.on(InteractionInvitationEvent.Timeout, () => {
      // 超时，主动告知取消
      this.sendIM(CustomMessageTypes.CancelInteractionInvitation, {
        sessionId,
        studentId,
      });
      this.removeSession(sessionId);
    });
    stateMachine.on(InteractionInvitationEvent.Rejected, () => {
      this.removeSession(sessionId);
    });

    stateMachine.transition(InteractionInvitationEvent.SendInvitation);

    const newSession: InteractionSession = {
      sessionId,
      remoteUserId: studentId,
      type,
      stateMachine,
    };
    this.pendingSessionQueue.push(newSession);
    return stateMachine;
  }

  cancelInvitation(studentId: string): InteractionInvitationStateMachine {
    this.checkRole();

    const type = CustomMessageTypes.CancelInteractionInvitation;
    const prevType = CustomMessageTypes.InteractionInvitation;
    const session = this.getSession({
      remoteUserId: studentId,
      type: prevType,
    });
    if (!session) {
      throw createInteractionError(ERROR.STATE_ACTION_MISMATCH, {
        remoteUserId: studentId,
        prevType,
        type,
      });
    }

    const { stateMachine, sessionId } = session;
    stateMachine.on(InteractionInvitationEvent.Cancel, () => {
      this.sendIM(type, {
        sessionId,
        studentId,
      });
      this.removeSession(sessionId);
    });
    stateMachine.transition(InteractionInvitationEvent.Cancel);
    return stateMachine;
  }

  // 周知连麦更新
  sendInteractionUpdated(data: (ISpectatorInfo | string)[]) {
    this.checkRole();

    const sessionType = CustomMessageTypes.InteractionMemberUpdated;
    this.sendIM(sessionType, {
      sessionId: this.getSessionId(sessionType),
      studentId: '',
      data,
    });
  }

  handleInvitationAccepted(data: InteractionIMData) {
    this.checkRole();

    const { sessionId } = data;
    const session = this.getSession({ sessionId });
    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        handler: 'handleInvitationAccepted',
        ...data,
      });
    }

    const { stateMachine } = session;
    stateMachine.on(InteractionInvitationEvent.Accepted, () => {
      this.removeSession(sessionId);
    });
    stateMachine.transition(InteractionInvitationEvent.Accepted);
  }

  handleInvitationRejected(data: InteractionIMData) {
    this.checkRole();

    const { sessionId } = data;
    const session = this.getSession({ sessionId });
    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        handler: 'handleInvitationRejected',
        ...data,
      });
    }

    const { stateMachine } = session;
    stateMachine.on(InteractionInvitationEvent.Rejected, () => {
      this.removeSession(sessionId);
    });
    stateMachine.transition(InteractionInvitationEvent.Rejected, data);
  }

  private setApplicationExpired(studentId: string): void {
    const session = this.pendingApplication.get(studentId);
    if (!session) return;

    console.log('[TeacherInteractionManager] setApplicationExpired: ', {
      studentId,
      sessionId: session.sessionId,
    });

    this.expiredSessionIds.push(session.sessionId);
    this.pendingApplication.delete(studentId);
  }

  receiveApplication(
    data: InteractionIMData,
    status?: InteractionStatus
  ): boolean {
    this.checkRole();

    const { sessionId, studentId } = data;
    const { full = false, interactionAllowed = true } = status ?? {};
    if (full || !interactionAllowed) {
      this.sendIM(CustomMessageTypes.RejectedInteractionApplication, {
        sessionId,
        studentId,
        full,
        interactionAllowed,
      });
      return false;
    }

    if (this.isExpiredSessionId(data.sessionId)) {
      return false;
    }
    const lastSession = this.pendingApplication.get(studentId);
    if (lastSession?.sessionId === sessionId) {
      return false;
    }
    this.pendingApplication.set(studentId, data);
    return true;
  }

  acceptApplication(studentId: string) {
    this.checkRole();

    const type = CustomMessageTypes.AcceptedInteractionApplication;
    const session = this.pendingApplication.get(studentId);

    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        studentId,
        type,
      });
    }

    this.sendIM(type, session);
  }

  rejectApplication(studentId: string, status?: InteractionStatus) {
    this.checkRole();

    const type = CustomMessageTypes.RejectedInteractionApplication;
    const session = this.pendingApplication.get(studentId);

    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        studentId,
        type,
      });
    }

    this.sendIM(type, {
      ...session,
      ...(status ?? {}),
    });
    this.setApplicationExpired(studentId);
  }

  handleApplicationCanceled(data: InteractionIMData) {
    const { sessionId, studentId } = data;
    if (this.isExpiredSessionId(sessionId)) {
      return false;
    }

    this.setApplicationExpired(studentId);
  }

  handleApplicationSucceed(data: InteractionIMData) {
    const { sessionId, studentId } = data;
    if (this.isExpiredSessionId(sessionId)) {
      return false;
    }

    this.setApplicationExpired(studentId);
  }

  endInteraction(studentId: string) {
    this.checkRole();

    this.sendIM(CustomMessageTypes.TeacherEndInteraction, {
      sessionId: this.getSessionId(CustomMessageTypes.TeacherEndInteraction),
      studentId,
    });
  }

  endAllInteraction() {
    this.checkRole();

    this.sendIM(CustomMessageTypes.TeacherEndAllInteraction, {
      sessionId: this.getSessionId(CustomMessageTypes.TeacherEndAllInteraction),
      studentId: '',
    });
  }

  allowEndInteraction(data: InteractionIMData) {
    this.checkRole();

    this.sendIM(CustomMessageTypes.StudentEndInteractionAllowed, data);
  }

  interactionAllowed(allowed: boolean) {
    this.checkRole();

    this.sendIM(CustomMessageTypes.InteractionAllowed, {
      sessionId: this.getSessionId(CustomMessageTypes.InteractionAllowed),
      studentId: '',
      allowed,
    });
  }

  allMicMuted(muted: boolean) {
    this.checkRole();

    this.sendIM(CustomMessageTypes.AllMicMuted, {
      sessionId: this.getSessionId(CustomMessageTypes.AllMicMuted),
      studentId: '',
      muted,
    });
  }

  ToggleCamera(
    studentId: string,
    turnOn: boolean
  ): ToggleRemoteDeviceStateMachine {
    this.checkRole();

    const sessionType = CustomMessageTypes.ToggleCamera;
    const session = this.getSession({
      remoteUserId: studentId,
      type: sessionType,
    });
    if (session) {
      throw createInteractionError(ERROR.STATE_ACTION_MISMATCH, {
        remoteUserId: studentId,
        type: sessionType,
        state: session.stateMachine.state,
      });
    }

    const sessionId = this.getSessionId(sessionType);
    const stateMachine = new ToggleRemoteDeviceStateMachine(
      ToggleRemoteDeviceState.Initial
    );
    stateMachine.on(ToggleRemoteDeviceEvent.Notice, () => {
      this.sendIM(sessionType, {
        sessionId,
        studentId,
        turnOn,
      });
    });
    stateMachine.on(ToggleRemoteDeviceEvent.Timeout, () => {
      this.removeSession(sessionId);
    });

    stateMachine.transition(ToggleRemoteDeviceEvent.Notice);

    const newSession: InteractionSession = {
      sessionId,
      remoteUserId: studentId,
      type: sessionType,
      stateMachine,
    };
    this.pendingSessionQueue.push(newSession);
    return stateMachine;
  }

  handleToggleCameraAnswered(data: InteractionIMData) {
    this.checkRole();

    const { studentId, sessionId, failed = false } = data;
    const session = this.getSession({ sessionId });
    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        remoteUserId: studentId,
        type: CustomMessageTypes.ToggleCamera,
      });
    }

    const { stateMachine } = session;
    stateMachine.on(ToggleRemoteDeviceEvent.Answered, () => {
      this.removeSession(sessionId);
    });
    stateMachine.transition(ToggleRemoteDeviceEvent.Answered, failed);
  }

  ToggleMic(
    studentId: string,
    turnOn: boolean
  ): ToggleRemoteDeviceStateMachine {
    this.checkRole();

    const sessionType = CustomMessageTypes.ToggleMic;
    const session = this.getSession({
      remoteUserId: studentId,
      type: sessionType,
    });
    if (session) {
      throw createInteractionError(ERROR.STATE_ACTION_MISMATCH, {
        remoteUserId: studentId,
        type: sessionType,
        state: session.stateMachine.state,
      });
    }

    const sessionId = this.getSessionId(sessionType);
    const stateMachine = new ToggleRemoteDeviceStateMachine(
      ToggleRemoteDeviceState.Initial
    );
    stateMachine.on(ToggleRemoteDeviceEvent.Notice, () => {
      this.sendIM(CustomMessageTypes.ToggleMic, {
        sessionId,
        studentId,
        turnOn,
      });
    });
    stateMachine.on(ToggleRemoteDeviceEvent.Timeout, () => {
      this.removeSession(sessionId);
    });

    stateMachine.transition(ToggleRemoteDeviceEvent.Notice);

    const newSession: InteractionSession = {
      sessionId,
      remoteUserId: studentId,
      type: sessionType,
      stateMachine,
    };
    this.pendingSessionQueue.push(newSession);
    return stateMachine;
  }

  handleToggleMicAnswered(data: InteractionIMData) {
    this.checkRole();

    const { studentId, sessionId, failed = false } = data;
    const session = this.getSession({ sessionId, remoteUserId: studentId });
    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        remoteUserId: studentId,
        type: CustomMessageTypes.ToggleMic,
      });
    }

    const { stateMachine } = session;
    stateMachine.on(ToggleRemoteDeviceEvent.Answered, () => {
      this.removeSession(sessionId);
    });
    stateMachine.transition(ToggleRemoteDeviceEvent.Answered, failed);
  }
}
