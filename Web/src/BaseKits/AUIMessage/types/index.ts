export * from './interaction';

export enum AUIMessageEvents {
  onJoinGroup = 'onJoinGroup',
  onLeaveGroup = 'onLeaveGroup',
  onMuteGroup = 'onMuteGroup',
  onUnmuteGroup = 'onUnmuteGroup',
  onMessageReceived = 'onMessageReceived',
}

export interface AUIMessageUserInfo {
  userId: string;
  userNick: string;
  userAvatar: string;
}

export interface AUIMessageConfig {
  token: string;
}
