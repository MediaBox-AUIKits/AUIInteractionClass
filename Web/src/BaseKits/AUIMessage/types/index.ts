export * from './interaction';

export enum AUIMessageEvents {
  onJoinGroup = 'onJoinGroup',
  onLeaveGroup = 'onLeaveGroup',
  onMuteGroup = 'onMuteGroup',
  onUnmuteGroup = 'onUnmuteGroup',
  onMuteUser = 'onMuteUser',
  onUnmuteUser = 'onUnmuteUser',
  onMessageReceived = 'onMessageReceived',
}

export interface AUIMessageUserInfo {
  userId: string;
  userNick: string;
  userAvatar: string;
}

export interface AUIMessageConfig {
  aliyunAccessToken?: string;
  rongCloudToken?: string;
}
