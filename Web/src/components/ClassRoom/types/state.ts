import {
  IClassroomInfo,
  ISpectatorInfo,
  IUserInfo,
  InteractionInvitationUpdateType,
} from './classroom';
import { IMemberInfo } from './member';

interface MicrophoneState {
  enable: boolean;
  deviceCount: number;
  deviceId?: string;
  trackId?: string; // 目前作用不大，只用于判断是否已成功开启设备
  fromInit?: boolean;
  controlling?: boolean; // 是否正在受控
}

export type StreamSize = {
  width: number;
  height: number;
};

interface CameraState {
  enable: boolean;
  deviceCount: number;
  deviceId?: string;
  trackId?: string; // 目前作用不大，只用于判断是否已成功开启设备
  size?: StreamSize;
  fromInit?: boolean;
  controlling?: boolean; // 是否正在受控
}

interface Pusher {
  executing: boolean; // 启动或者停止推流执行中
  pushing: boolean; // 是否推流中
  interrupted: boolean; // 是否因网络等原因意外中断的
  startTime?: Date;
}

export interface IDisplayState {
  enable: boolean;
  deviceId?: string;
  trackId?: string; // 目前作用不大，只用于判断是否已成功开启设备
  size?: StreamSize;
  // 切换到录制屏幕时，摄像头是否已打开
  captureAudio?: boolean;
}

export interface CommentMessage {
  messageId?: string;
  nickName?: string;
  userId: string;
  content: string;
  isSelf?: boolean; // 是否是自己发的
  isTeacher?: boolean; // 是否是老师发的
}

export interface IBoard {
  server?: string; // 白板服务提供商
  mediaStream?: MediaStream; // 白板画面流
}

export interface ILocalMediaSource {
  source: string;
  name: string;
}

export interface ILocalMedia {
  sources: ILocalMediaSource[];
  mediaStream?: MediaStream; // 本地媒体文件的媒体流
}

export interface IClassroomState {
  // 课堂数据
  classroomInfo: IClassroomInfo;
  memberListFlag: number; // 用于触发重新获取成员列表
  memberList: IMemberInfo[];

  // 消息相关
  joinedGroupId: string;
  messageList: CommentMessage[];
  commentInput: string; // 输入框内容
  groupMuted: boolean; // 互动消息 组是否被禁言
  selfMuted: boolean; // 个人是否被禁言

  // 设备和推流相关
  supportWebRTC?: boolean;
  microphone: MicrophoneState;
  camera: CameraState;
  display: IDisplayState;
  pusher: Pusher;
  board: IBoard;
  localMedia: ILocalMedia;

  // 连麦相关
  connectedSpectators: ISpectatorInfo[]; // 连麦观众数组
  interactionAllowed: boolean; // 允许连麦
  allMicMuted: boolean; // 全员静音
  // 学生侧
  // TODO: 后续放到组件中维护
  interactionInvitationSessionId?: string; // 学生被连麦邀请 sessionId
  interactionStarting: boolean; // 连麦启动中开始
  interacting: boolean; // 连麦开始
  controlledMicOpened: boolean; // 受控麦克风开启
  controlledCameraOpened: boolean; // 受控摄像头开启
  // 老师侧
  interactionFull: boolean; // 连麦人数达到限制
  applyingList: IUserInfo[]; // 学生申请连麦列表
  interactionInvitationUsers: string[]; // 老师端邀请学生连麦的用户id数组
}

export interface ClassroomActions {
  reset: () => void;
  setClassroomInfo: (info: IClassroomInfo) => void;
  increaseMemberListFlag: () => void;
  setMemberList: (memberList: IMemberInfo[]) => void;
  setCommentInput: (text: string) => void;
  setMessageList: (list: CommentMessage[]) => void;
  setJoinedGroupId: (id: string) => void;
  setGroupMuted: (bool: boolean) => void;
  setSelfMuted: (bool: boolean) => void;

  setSupportWebRTC: (bool: boolean) => void;
  setMicrophoneEnable: (enable: boolean, fromInit?: boolean) => void;
  setMicrophoneControlling: (controlling: boolean) => void;
  setMicrophoneDeviceCount: (count: number) => void;
  setMicrophoneDevice: (deviceId: string) => void;
  setMicrophoneTrackId: (trackId: string) => void;
  setCameraEnable: (enable: boolean, fromInit?: boolean) => void;
  setCameraControlling: (controlling: boolean) => void;
  setCameraDeviceCount: (count: number) => void;
  setCameraDevice: (deviceId: string) => void;
  setCameraTrackId: (trackId: string) => void;
  setDisplayEnable: (enable: boolean) => void;
  setDisplayDevice: (deviceId: string) => void;
  setDisplayState: (displayState: IDisplayState) => void;
  setDisplayTrackId: (trackId: string, size?: StreamSize) => void;
  setPushing: (pushing: boolean, interrupted?: boolean) => void;
  setPusherInterrupted: (interrupted: boolean) => void;
  setPusherExecuting: (bool: boolean) => void;
  setPusherTime: (time: Date) => void;

  setBoard: (info: IBoard) => void;
  setLocalMedia: (info: ILocalMedia) => void;
  setLocalMediaStream: (stream?: MediaStream) => void;
  setLocalMediaSources: (sources: ILocalMediaSource[]) => void;

  updateInteractionInvitationUsers: (
    type: InteractionInvitationUpdateType,
    userId: string
  ) => void;
  updateApplyingList: (userId: string, userInfo?: IUserInfo) => void;

  setInteractionInvitationSessionId: (sessionId?: string) => void;
  setInteractionStarting: (bool: boolean) => void;
  setInteracting: (bool: boolean) => void;
  setControlledCameraOpened: (bool: boolean) => void;
  setControlledMicOpened: (bool: boolean) => void;
  setConnectedSpectators: (arr: ISpectatorInfo[]) => void;
  updateConnectedSpectator: (
    userId: string,
    userInfo?: Partial<ISpectatorInfo>,
    updateOnly?: boolean
  ) => void;
  setInteractionAllowed: (bool: boolean) => void;
  setAllMicMuted: (bool: boolean) => void;
}
