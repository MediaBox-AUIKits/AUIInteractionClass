import { IdentityForServer } from '@/types';
import { IMemberInfo } from './index';

export enum UserRoleEnum {
  Student = 0,
  Teacher = 1,
  Assistant = 2, // 助教
  Patrol = 3, // 巡课
}

export enum ClassroomModeEnum {
  Open = 0, // 公开课
  Big = 1, // 大班课
  Small = 2, // 小班课
}

export enum SourceType {
  Camera = 'camera',
  Material = 'material',
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
  flvScreenUrl: string;
  hlsScreenUrl: string;
  rtmpScreenUrl: string;
  rtsScreenUrl: string;
  [x: string]: string;
}

export interface ILinkUrlInfo {
  rtcPullUrl: string;
  rtcPushUrl: string;
  cdnPullInfo: IPullUrlInfo;
}

export interface ICdnUrlMap {
  [SourceType.Material]?: Record<string, string>;
  [SourceType.Camera]?: Record<string, string>;
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
  status: VODStatusEnum;
  playlist: IPlaylistItem[];
}

export interface IAssistantInfo extends IMemberInfo {
  classId: string;
}

// 签到信息
export interface CheckInInfo {
  id: string; // 签到id
  startTime: string; // 开始时间
  duration: number; // 秒
  nowTime: string; // 当前服务端时间
}

// 签到记录
export interface StudentCheckInRecord {
  userId: string; // 已签到的学生 userId
  time: string; // 签到时间
  checkInId: string; // 签到id
  classId: string; // 教室id
}

export interface IClassroomInfo {
  id: string; // 教室 id
  chatId?: string; // 上一版的群组ID字段名
  aliyunId?: string; // 阿里云互动消息组id
  rongCloudId?: string; // 融云IM消息组id
  teacherId: string; // 教师id
  teacherNick: string; // 教师昵称
  assistantId?: string; // 助教id
  assistantPermit?: IAssistantInfo; // 助教信息
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
  shadowLinkInfo?: ILinkUrlInfo;
  // vod 回看数据
  vodInfo?: IVODInfo;
}

export interface IUserInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: UserRoleEnum; // 用户角色
}

export interface ISpectatorInfo {
  userId: string;
  userNick: string;
  userAvatar?: string;
  rtcPullUrl?: string;
  cameraOpened?: boolean; // 是否开启摄像头
  micOpened?: boolean; // 是否开启麦克风
  screenShare?: boolean; // 是否开启屏幕分享
  mutilMedia?: boolean; // 是否开启插播
  isAudioPublishing?: boolean; // 是否有 audio track
  isVideoPublishing?: boolean; // 是否有 video track
  isScreenPublishing?: boolean; // 是否有 screen track
  controlledCameraOpened?: boolean; // 摄像头受控状态
  controlledMicOpened?: boolean; // 麦克风受控状态
}

export interface MeetingInfo {
  members: ISpectatorInfo[];
  allMute?: boolean;
  interactionAllowed?: boolean;
}

export enum InteractionInvitationUpdateType {
  Add,
  Remove,
}
