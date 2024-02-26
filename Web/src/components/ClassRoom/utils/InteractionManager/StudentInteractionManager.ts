import InteractionManager, {
  createInteractionError,
} from './InteractionManager';
import { CustomMessageTypes, UserRoleEnum } from '@/types';
import {
  InteractionSession,
  ERROR,
  InteractionInvitationEvent,
  InteractionManagerProps,
  InteractionApplicationState,
  InteractionApplicationEvent,
  StudentEndInteractionState,
  StudentEndInteractionEvent,
  StudentActionParams,
  InteractionIMData,
} from './index.d';
import {
  InteractionApplicationStateMachine,
  StudentEndInteractionStateMachine,
} from './StateMachine';

export default class StudentInteractionManager extends InteractionManager {
  private invitationSessionId?: string;
  private toggleCameraSessionId?: string;
  private toggleMicSessionId?: string;

  constructor(props: InteractionManagerProps) {
    super(props);
    this.role = UserRoleEnum.Student;
  }

  private setSessionIdExpired(sessionId: string): void {
    if (!!this.expiredSessionIds.find(item => item === sessionId)) return;

    if (sessionId === this.invitationSessionId)
      this.invitationSessionId = undefined;
    if (sessionId === this.toggleCameraSessionId)
      this.toggleCameraSessionId = undefined;
    if (sessionId === this.toggleMicSessionId)
      this.toggleMicSessionId = undefined;

    console.log('[StudentInteractionManager] setSessionIdExpired: ', sessionId);
    this.expiredSessionIds.push(sessionId);
  }

  protected checkRole() {
    if (this.role === UserRoleEnum.Teacher) {
      throw createInteractionError(ERROR.ROLE_ACTION_MISMATCH);
    }
  }

  receiveInvitation(data: InteractionIMData): boolean {
    this.checkRole();

    const { sessionId } = data;
    if (this.isExpiredSessionId(sessionId)) {
      return false;
    }
    if (this.invitationSessionId === sessionId) {
      return false;
    }

    this.invitationSessionId = sessionId;
    return true;
  }

  sendAcceptedResp(data: InteractionIMData) {
    this.checkRole();

    if (this.isExpiredSessionId(data.sessionId)) {
      return;
    }

    this.sendIM(CustomMessageTypes.AcceptedInteractionInvitation, data);
    this.setSessionIdExpired(data.sessionId);
    this.invitationSessionId = undefined;
  }

  rejectInvitation(data: InteractionIMData) {
    this.checkRole();

    this.sendIM(CustomMessageTypes.RejectedInteractionInvitation, data);
    this.setSessionIdExpired(data.sessionId);
  }

  handleInvitationCanceled(data: InteractionIMData) {
    this.checkRole();

    if (this.isExpiredSessionId(data.sessionId)) {
      return false;
    }

    this.setSessionIdExpired(data.sessionId);
    this.invitationSessionId = undefined;
  }

  application(params: StudentActionParams) {
    this.checkRole();

    const type = CustomMessageTypes.InteractionApplication;
    const session = this.getSession({
      type,
    });
    if (session) {
      throw createInteractionError(ERROR.STATE_ACTION_MISMATCH, {
        type,
        state: session.stateMachine.state,
      });
    }

    const sessionId = this.getSessionId(type);
    const stateMachine = new InteractionApplicationStateMachine(
      InteractionApplicationState.Initial
    );
    stateMachine.on(InteractionApplicationEvent.SubmitApplication, () => {
      this.sendIM(type, {
        sessionId,
        ...params,
      });
    });
    stateMachine.on(InteractionApplicationEvent.Timeout, () => {
      // 超时，主动告知取消
      this.sendIM(CustomMessageTypes.CancelInteractionApplication, {
        ...params,
        sessionId,
      });
      this.removeSession(sessionId);
    });
    stateMachine.on(InteractionApplicationEvent.Cancel, () => {
      this.removeSession(sessionId);
      this.setSessionIdExpired(sessionId);
    });
    stateMachine.on(InteractionApplicationEvent.Rejected, () => {
      this.removeSession(sessionId);
      this.setSessionIdExpired(sessionId);
    });

    stateMachine.transition(InteractionApplicationEvent.SubmitApplication);

    const newSession: InteractionSession = {
      sessionId,
      remoteUserId: params.teacherId,
      type,
      stateMachine: stateMachine,
    };

    this.pendingSessionQueue.push(newSession);
    return stateMachine;
  }

  cancelApplication(params: StudentActionParams) {
    this.checkRole();

    const prevType = CustomMessageTypes.InteractionApplication;
    const session = this.getSession({
      type: prevType,
    });
    const type = CustomMessageTypes.CancelInteractionApplication;

    if (!session) {
      throw createInteractionError(ERROR.STATE_ACTION_MISMATCH, {
        type,
        prevType,
      });
    }

    const { stateMachine, sessionId } = session;

    stateMachine.transition(InteractionInvitationEvent.Cancel);

    this.sendIM(type, {
      ...params,
      sessionId,
    });
  }

  handleApplicationAccepted(data: any) {
    this.checkRole();

    const { sessionId } = data;
    const session = this.getSession({
      sessionId,
    });
    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        handler: 'handleApplicationAccepted',
        ...data,
      });
    }

    const { stateMachine } = session;
    stateMachine.transition(InteractionApplicationEvent.Accepted);
    return stateMachine;
  }

  handleApplicationRejected(data: any) {
    this.checkRole();

    const { sessionId } = data;
    const session = this.getSession({ sessionId });
    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        handler: 'handleApplicationRejected',
        ...data,
      });
    }

    const { stateMachine } = session;

    stateMachine.transition(InteractionApplicationEvent.Rejected);
  }

  interacting(
    data: Pick<
      InteractionIMData,
      'teacherId' | 'studentId' | 'rtcPullUrl' | 'micOpened' | 'cameraOpened'
    >
  ) {
    this.checkRole();

    const { teacherId } = data;
    const type = CustomMessageTypes.InteractionApplicationSucceed;
    const prevType = CustomMessageTypes.InteractionApplication;
    const session = this.getSession({
      type: prevType,
    });

    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        teacherId,
        type,
        prevType,
      });
    }

    const { sessionId } = session;
    this.sendIM(type, {
      ...data,
      sessionId,
    });
    this.removeSession(sessionId);
    this.setSessionIdExpired(sessionId);
  }

  // 告知老师要结束连麦
  noticeEndingInteraction(params: StudentActionParams) {
    this.checkRole();

    const type = CustomMessageTypes.StudentEndInteraction;
    const session = this.getSession({
      type,
    });

    if (session) {
      throw createInteractionError(ERROR.STATE_ACTION_MISMATCH, {
        type,
        state: session.stateMachine.state,
      });
    }

    const sessionId = this.getSessionId(type);
    const stateMachine = new StudentEndInteractionStateMachine(
      StudentEndInteractionState.Initial
    );

    stateMachine.on(StudentEndInteractionEvent.Notice, () => {
      this.sendIM(type, {
        sessionId,
        ...params,
      });
    });
    stateMachine.on(StudentEndInteractionEvent.Timeout, () => {
      this.removeSession(sessionId);
    });
    stateMachine.on(StudentEndInteractionEvent.Allowed, () => {
      this.removeSession(sessionId);
    });

    stateMachine.transition(StudentEndInteractionEvent.Notice);

    const newSession: InteractionSession = {
      sessionId,
      remoteUserId: params.teacherId,
      type,
      stateMachine: stateMachine,
    };

    this.pendingSessionQueue.push(newSession);
    return stateMachine;
  }

  handleEndingInteractionAllowed(data: InteractionIMData) {
    this.checkRole();

    const { sessionId } = data;
    const session = this.getSession({
      sessionId,
    });

    if (!session) {
      throw createInteractionError(ERROR.SESSION_MISSED, {
        handler: 'handleEndingInteractionAllowed',
        ...data,
      });
    }

    const { stateMachine } = session;
    stateMachine.transition(StudentEndInteractionEvent.Allowed);
    return stateMachine;
  }

  notifyMicStatusChanged(param: StudentActionParams) {
    this.checkRole();

    this.sendIM(CustomMessageTypes.MicChanged, {
      ...param,
      sessionId: this.getSessionId(CustomMessageTypes.MicChanged),
    });
  }

  notifyCameraStatusChanged(param: StudentActionParams) {
    this.checkRole();

    this.sendIM(CustomMessageTypes.CameraChanged, {
      ...param,
      sessionId: this.getSessionId(CustomMessageTypes.CameraChanged),
    });
  }

  handleCameraControl(data: InteractionIMData) {
    this.checkRole();

    const { sessionId } = data;
    if (this.isExpiredSessionId(sessionId)) {
      return false;
    }
    if (this.toggleCameraSessionId === sessionId) {
      return false;
    }

    this.toggleCameraSessionId = sessionId;
    return true;
  }

  answerCameraControl(params: StudentActionParams) {
    this.checkRole();

    if (
      !this.toggleCameraSessionId ||
      this.isExpiredSessionId(this.toggleCameraSessionId)
    ) {
      return;
    }
    this.sendIM(CustomMessageTypes.ToggleCameraAnswered, {
      ...params,
      sessionId: this.toggleCameraSessionId,
    });
    this.setSessionIdExpired(this.toggleCameraSessionId);
    this.toggleCameraSessionId = undefined;
  }

  handleMicControl(data: InteractionIMData) {
    this.checkRole();

    const { sessionId } = data;
    if (this.isExpiredSessionId(sessionId)) {
      return false;
    }
    if (this.toggleMicSessionId === sessionId) {
      return false;
    }

    this.toggleMicSessionId = sessionId;
    return true;
  }

  answerMicControl(params: StudentActionParams) {
    this.checkRole();

    if (
      !this.toggleMicSessionId ||
      this.isExpiredSessionId(this.toggleMicSessionId)
    ) {
      return;
    }
    this.sendIM(CustomMessageTypes.ToggleMicAnswered, {
      ...params,
      sessionId: this.toggleMicSessionId,
    });
    this.setSessionIdExpired(this.toggleMicSessionId);
    this.toggleMicSessionId = undefined;
  }
}
