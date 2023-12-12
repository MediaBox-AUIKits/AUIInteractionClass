import { StateMachine } from './StateMachine';
import { CustomMessageTypes, UserRoleEnum } from '../../types';

export interface InteractionError {
  reason: ERROR;
  args: any;
}

export enum ERROR {
  ROLE_ACTION_MISMATCH = 'roleAndActionMismatch',
  STATE_ACTION_MISMATCH = 'stateAndActionMismatch',
  SESSION_MISSED = 'sessionMissed',
}

export enum MuteGroupOrUserState {
  Initial = 'initial',
  Requesting = 'requesting',
  RetryRequesting = 'retryRequesting',
  Responsed = 'responsed',
}

export enum MuteGroupOrUserEvent {
  Request = 'request',
  Retry = 'retry',
  Timeout = 'timeout',
  Responsed = 'responsed',
}

export interface MuteGroupOrUserListener {
  [MuteGroupOrUserEvent.Request]: (payload: CooperationEventPayload) => void;
  [MuteGroupOrUserEvent.Retry]: (payload: CooperationEventPayload) => void;
  [MuteGroupOrUserEvent.Responsed]: (payload: CooperationEventPayload) => void;
  [MuteGroupOrUserEvent.Timeout]: (payload: CooperationEventPayload) => void;
}

export interface CooperationSession {
  sessionId: string;
  receiverId: string;
  type: CustomMessageTypes; // 会话类型
  stateMachine: StateMachine; // 当前状态
  flag?: string | number; // 额外标记，用于判断session是否存在
}

export interface CooperationProps {
  message: InstanceType<typeof AUIMessage>;
  defaultReceiverId?: string; // 默认接收方
}

// 管理员间协同IM消息数据
export interface CooperationIMData {
  sessionId: string;
  [key: string]: any;
}

export interface CooperationEventPayload<S extends MuteGroupOrUserState> {
  state: S;
  [x: string]: any;
}

export interface CooperationActionParams {
  [x: string]: any;
}
