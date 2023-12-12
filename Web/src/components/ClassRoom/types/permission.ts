// 功能
export enum ClassroomFunction {
  // 课堂状态管理
  SwitchClassStatus = 'SwitchClassStatus',
  // 成员管理
  KickMember = 'KickMember',
  // 辅助教学
  DrawWhiteboard = 'DrawWhiteboard',
  WhiteboardPageTurner = 'WhiteboardPageTurner',
  UpdateCourceware = 'UpdateCourceware',
  // 互动管理
  RemoveGroupMessage = 'RemoveGroupMessage',
  MuteGroup = 'MuteGroup',
  // 连麦管理
  InteractionManagement = 'InteractionManagement',
  MuteInteraction = 'MuteInteraction',
  AllowInteraction = 'AllowInteraction',
  // 辅助教学
  ScreenShare = 'ScreenShare',
  LocalMediaShare = 'LocalMediaShare',
  Camera = 'Camera',
  Mic = 'Mic',
  JoinInteraction = 'JoinInteraction',
}

export type PermissionVerificationProps<T = {}> = T & {
  noPermission?: boolean;
  noPermissionNotify?: string;
};
