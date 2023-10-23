export enum MemberStatus {
  online = 1,
  offline = 2,
  kicked = 3,
}

export interface IMemberInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  status: MemberStatus; // 状态
  identity?: number; // 服务端用户角色，目前无用
  joinTime?: string; // 加入的时间，目前无用
}
