export enum UserRoleEnum {
  Student = 0,
  Teacther = 1,
  Assistant = 2, // 助教，预留字段
}

export enum ClassroomModeEnum {
  Open = 0, // 公开课
  Big = 1, // 大班课
  Small = 2, // 小班课
}

export enum ClassroomStatusEnum {
  no_data = -1, // 非服务端状态，意思为还未取到数据
  not_start = 0, // 未上课
  started = 1, // 上课中
  ended = 2, // 已下课
}

export interface IPullUrlInfo {
  flvUrl: string;
  hlsUrl: string;
  rtmpUrl: string;
  rtsUrl: string;
  [x: string]: string;
}

export interface ILinkUrlInfo {
  rtcPullUrl: string;
  rtcPushUrl: string;
  cdnPullInfo: IPullUrlInfo;
}

export enum VODStatusEnum {
  preparing = 0, // 准备中
  success = 1, // 成功
  fail = 2, // 失败
}

export interface IPlaylistItem {
  bitRate: string;
  creationTime: string;
  definition: string; // 清晰度标识
  format: string; // 文件格式
  duration: string; // 数字字符串
  fps: string; // 数字字符串
  width: number;
  height: number;
  playUrl: string;
  size: number;
  streamType: string; // 流类型，video | audio
}

export interface IVODInfo {
  status: VODStatusEnum,
  playlist: IPlaylistItem[],
}

export interface IClassroomInfo {
  id: string; // 教室 id
  chatId: string; // im 聊天组 id
  teacherId: string; // 教师id
  teacherNick: string; // 教师昵称
  boards: string; // JSONString 白板相关数据
  createdAt: string; // 创建时间
  extends: string; // 额外配置 jsonstring
  coverUrl: string; // 封面图片
  notice: string; // 公告
  mode: ClassroomModeEnum; // 课堂模式
  status: ClassroomStatusEnum; // 状态
  title: string; // 课堂标题
  updatedAt: string; // 更新时间
  startedAt?: string; // 开始上课时间
  // 连麦有的字段
  linkInfo?: ILinkUrlInfo;
  // vod 回看数据
  vodInfo?: IVODInfo;
}