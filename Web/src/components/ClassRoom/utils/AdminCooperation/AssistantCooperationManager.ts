import CooperationManager, {
  createCooperationError,
} from './CooperationManager';
import { CustomMessageTypes, UserRoleEnum } from '@/types';
import {
  CooperationSession,
  ERROR,
  MuteGroupOrUserState,
  MuteGroupOrUserEvent,
  CooperationProps,
  CooperationIMData,
  CooperationActionParams,
} from '.';
import { AssistantMuteGroupOrUserStateMachine } from './StateMachine';

export default class AssistantCooperationManager extends CooperationManager {
  constructor(props: CooperationProps) {
    super(props);
    this.role = UserRoleEnum.Assistant;
  }

  protected checkRole() {
    if (this.role !== UserRoleEnum.Assistant) {
      throw createCooperationError(ERROR.ROLE_ACTION_MISMATCH);
    }
  }

  muteUser(
    params: CooperationActionParams = {},
    receiverId = this.defaultReceiverId ?? ''
  ) {
    this.checkRole();

    const sessionFlag = params.userId;
    const type = CustomMessageTypes.RequestMuteUser;
    const session = this.getSession({
      type,
      receiverId,
      flag: sessionFlag,
    });
    if (session) {
      throw createCooperationError(ERROR.STATE_ACTION_MISMATCH, {
        type,
        state: session.stateMachine.state,
      });
    }

    const sessionId = this.getSessionId(type);
    const stateMachine = new AssistantMuteGroupOrUserStateMachine(
      MuteGroupOrUserState.Initial
    );
    stateMachine.on(MuteGroupOrUserEvent.Request, () => {
      this.sendIM(type, receiverId, {
        sessionId,
        ...params,
      });
    });
    stateMachine.on(MuteGroupOrUserEvent.Timeout, () => {
      this.removeSession(sessionId);
    });
    stateMachine.on(MuteGroupOrUserEvent.Responsed, () => {
      this.removeSession(sessionId);
    });

    stateMachine.transition(MuteGroupOrUserEvent.Request);

    const newSession: CooperationSession = {
      sessionId,
      receiverId,
      type,
      stateMachine: stateMachine,
      flag: sessionFlag,
    };

    this.pendingSessionQueue.push(newSession);
    return stateMachine;
  }

  handleMuteUserResponsed(data: CooperationIMData) {
    this.checkRole();

    const { sessionId, success } = data;
    const session = this.getSession({
      sessionId,
    });
    if (!session) {
      throw createCooperationError(ERROR.SESSION_MISSED, {
        handler: 'handleMuteUserResponsed',
        ...data,
      });
    }

    const { stateMachine } = session;
    stateMachine.transition(MuteGroupOrUserEvent.Responsed, success);
    return stateMachine;
  }

  muteGroup(
    params: CooperationActionParams = {},
    receiverId = this.defaultReceiverId ?? ''
  ) {
    this.checkRole();

    const type = CustomMessageTypes.RequestMuteGroup;
    const session = this.getSession({
      type,
      receiverId,
    });
    if (session) {
      throw createCooperationError(ERROR.STATE_ACTION_MISMATCH, {
        type,
        state: session.stateMachine.state,
      });
    }

    const sessionId = this.getSessionId(type);
    const stateMachine = new AssistantMuteGroupOrUserStateMachine(
      MuteGroupOrUserState.Initial
    );
    stateMachine.on(MuteGroupOrUserEvent.Request, () => {
      this.sendIM(type, receiverId, {
        sessionId,
        ...params,
      });
    });
    stateMachine.on(MuteGroupOrUserEvent.Timeout, () => {
      this.removeSession(sessionId);
    });
    stateMachine.on(MuteGroupOrUserEvent.Responsed, () => {
      this.removeSession(sessionId);
    });

    stateMachine.transition(MuteGroupOrUserEvent.Request);

    const newSession: CooperationSession = {
      sessionId,
      receiverId,
      type,
      stateMachine: stateMachine,
    };

    this.pendingSessionQueue.push(newSession);
    return stateMachine;
  }

  handleMuteGroupResponsed(data: CooperationIMData) {
    this.checkRole();

    const { sessionId, success } = data;
    const session = this.getSession({
      sessionId,
    });
    if (!session) {
      throw createCooperationError(ERROR.SESSION_MISSED, {
        handler: 'handleMuteGroupResponsed',
        ...data,
      });
    }

    const { stateMachine } = session;
    stateMachine.transition(MuteGroupOrUserEvent.Responsed, { success });
    return stateMachine;
  }
}
