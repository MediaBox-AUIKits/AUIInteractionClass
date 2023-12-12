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

export enum InteractionInvitationState {
  Initial = 'initial',
  Inviting = 'inviting',
  RetryInviting = 'retryInviting',
  Accepted = 'accepted',
}

export enum InteractionInvitationEvent {
  SendInvitation = 'sendInvitation',
  Retry = 'retry',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Cancel = 'cancel',
  Timeout = 'timeout',
}

export interface InteractionInvitationListener {
  [InteractionInvitationEvent.SendInvitation]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionInvitationEvent.Retry]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionInvitationEvent.Cancel]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionInvitationEvent.Accepted]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionInvitationEvent.Rejected]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionInvitationEvent.Timeout]: (
    payload: InteractionEventPayload
  ) => void;
}

export enum InteractionApplicationState {
  Initial = 'initial',
  Applying = 'applying',
  RetryApplying = 'retryApplying',
  Accepted = 'accepted',
  InteractionStarted = 'interacting',
}

export enum InteractionApplicationEvent {
  SubmitApplication = 'submitApplication',
  Retry = 'retry',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Cancel = 'cancel',
  Timeout = 'timeout',
}

export interface InteractionApplicationListener {
  [InteractionApplicationEvent.SubmitApplication]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionApplicationEvent.Retry]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionApplicationEvent.Cancel]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionApplicationEvent.Timeout]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionApplicationEvent.Accepted]: (
    payload: InteractionEventPayload
  ) => void;
  [InteractionApplicationEvent.Rejected]: (
    payload: InteractionEventPayload
  ) => void;
}

export enum ToggleRemoteDeviceState {
  Initial = 'initial',
  Waiting = 'waiting',
  Answered = 'answered',
}

export enum ToggleRemoteDeviceEvent {
  Notice = 'notice',
  Retry = 'retry',
  Answered = 'answered',
  Timeout = 'timeout',
}

export interface ToggleRemoteDeviceListener {
  [ToggleRemoteDeviceEvent.Notice]: (payload: InteractionEventPayload) => void;
  [ToggleRemoteDeviceEvent.Retry]: (payload: InteractionEventPayload) => void;
  [ToggleRemoteDeviceEvent.Answered]: (
    payload: InteractionEventPayload
  ) => void;
  [ToggleRemoteDeviceEvent.Timeout]: (payload: InteractionEventPayload) => void;
}

export enum StudentEndInteractionState {
  Initial = 'initial',
  Noticing = 'noticing',
  RetryNoticing = 'retryNoticing',
  Allowed = 'allowed',
}

export enum StudentEndInteractionEvent {
  Notice = 'notice',
  Retry = 'retry',
  Allowed = 'allowed',
  Timeout = 'timeout',
}

export interface StudentEndInteractionListener {
  [StudentEndInteractionEvent.Notice]: (
    payload: InteractionEventPayload
  ) => void;
  [StudentEndInteractionEvent.Retry]: (
    payload: InteractionEventPayload
  ) => void;
  [StudentEndInteractionEvent.Allowed]: (
    payload: InteractionEventPayload
  ) => void;
  [StudentEndInteractionEvent.Timeout]: (
    payload: InteractionEventPayload
  ) => void;
}

export interface InteractionSession {
  sessionId: string;
  remoteUserId: string;
  type: CustomMessageTypes; // 会话类型
  stateMachine: StateMachine; // 当前状态
}

export interface InteractionManagerProps {
  message: InstanceType<typeof AUIMessage>;
}

// 基础连麦IM消息数据
export interface InteractionIMData {
  sessionId: string;
  teacherId?: string;
  studentId: string;
  [key: string]: any;
}

export interface InteractionEventPayload<
  S extends
    | InteractionInvitationState
    | InteractionApplicationState
    | ToggleRemoteDeviceState
> {
  state: S;
  [x: string]: any;
}

export interface StudentActionParams {
  studentId: string;
  teacherId: string;
  [x: string]: any;
}

export interface InteractionStatus {
  full?: boolean;
  interactionAllowed?: boolean;
}

export enum RejectInteractionInvitationReason {
  Manual,
  NotSupportWebRTC,
  NoDevicePermissions,
}
