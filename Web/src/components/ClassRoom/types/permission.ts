// 功能
export enum ClassroomFunction {
  // 课程管理
  SwitchClassStatus = 'SwitchClassStatus',
  // 成员管理
  KickMember = 'KickMember',
  AttendanceManagement = 'AttendanceManagement',
  // 辅助教学
  DrawWhiteboard = 'DrawWhiteboard',
  WhiteboardPageTurner = 'WhiteboardPageTurner',
  UpdateCourceware = 'UpdateCourceware',
  // 互动消息管理
  EditAnnouncement = 'EditAnnouncement',
  RemoveGroupMessage = 'RemoveGroupMessage',
  MuteGroup = 'MuteGroup',
  MuteUser = 'MuteUser',
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
