import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { produce } from 'immer';
import {
  IClassroomState,
  IClassroomInfo,
  ClassroomActions,
  ClassroomModeEnum,
  ClassroomStatusEnum,
  CommentMessage,
  StreamSize,
  IDisplayState,
  IBoard,
  ILocalMedia,
  ILocalMediaSource,
  ISpectatorInfo,
  InteractionInvitationUpdateType,
  IMemberInfo,
  IUserInfo,
  UserRoleEnum,
  ClassroomFunction,
} from './types';
import { Permission } from '@/types';
import { MaxConnectedSpectatorNum, FunctionMapByPermission } from './constants';

const DEFAULT_SIZE = { width: 1280, height: 720 };

export const defaultClassroomInfo: IClassroomInfo = {
  id: '',
  boards: '{}',
  teacherId: '',
  teacherNick: '',
  aliyunId: '',
  rongCloudId: '',
  createdAt: '',
  extends: '',
  mode: ClassroomModeEnum.Open,
  status: ClassroomStatusEnum.no_data,
  title: '',
  updatedAt: '',
  notice: '',
  coverUrl: '',
  // 连麦有的字段
  linkInfo: {
    rtcPullUrl: '',
    rtcPushUrl: '',
    cdnPullInfo: {
      flvUrl: '',
      rtmpUrl: '',
      hlsUrl: '',
      rtsUrl: '',
      flvScreenUrl: '',
      hlsScreenUrl: '',
      rtmpScreenUrl: '',
      rtsScreenUrl: '',
    },
  },
  shadowLinkInfo: {
    rtcPullUrl: '',
    rtcPushUrl: '',
    cdnPullInfo: {
      flvUrl: '',
      rtmpUrl: '',
      hlsUrl: '',
      rtsUrl: '',
      flvScreenUrl: '',
      hlsScreenUrl: '',
      rtmpScreenUrl: '',
      rtsScreenUrl: '',
    },
  },
};

export const defaultClassroomState: IClassroomState = {
  classroomInfo: Object.assign({}, defaultClassroomInfo),
  memberListFlag: 0,
  memberList: [],

  // role
  isTeacher: false,
  isAssistant: false,
  isStudent: false,
  // permission
  isAdmin: false,
  accessibleFunctions: [],
  asstAccessibleFunctions: [],

  joinedGroupId: '',
  messageList: [],
  commentInput: '',
  groupMuted: false,
  selfMuted: false,

  // pusher
  supportWebRTC: undefined,
  microphone: { enable: false, deviceCount: 0 },
  camera: { enable: false, deviceCount: 0 },
  display: { enable: false },
  pusher: { pushing: false, executing: false, interrupted: false },
  // 白板
  board: {},
  localMedia: {
    sources: [],
  },
  docsUpdateFlag: 0,
  // 连麦相关
  connectedSpectators: [], // 连麦用户列表
  interactionAllowed: true, // 允许连麦
  allMicMuted: false, // 全员静音
  // 学生侧
  interactionStarting: false, // 连麦启动中开始
  interacting: false, // 连麦开始
  controlledMicOpened: true, // 受控麦克风静音
  controlledCameraOpened: true, // 受控摄像头关闭
  // 老师侧
  interactionFull: false, // 连麦人数达到限制
  applyingList: [], // 学生申请连麦列表
  interactionInvitationUsers: [], // 老师端邀请学生连麦的用户id数组
};

const useClassroomStore = create(
  subscribeWithSelector<IClassroomState & ClassroomActions>(set => ({
    ...defaultClassroomState,
    reset: () =>
      set(() => ({
        ...defaultClassroomState,
      })),

    setClassroomInfo: (info: IClassroomInfo) =>
      set(
        produce((state: IClassroomState) => {
          state.classroomInfo = info;
        })
      ),

    setRoleAssertion: (role: UserRoleEnum) =>
      set(
        produce((state: IClassroomState) => {
          const isTeacher = role === UserRoleEnum.Teacher;
          const isAssistant = role === UserRoleEnum.Assistant;
          state.isTeacher = isTeacher;
          state.isAssistant = isAssistant;
          state.isStudent = !isTeacher && !isAssistant;

          state.isAdmin = isTeacher || isAssistant;
        })
      ),
    setAccessibleFunctions: (permissions: Permission[]) =>
      set(
        produce((state: IClassroomState) => {
          const functions: ClassroomFunction[] = [];
          permissions.forEach(permission => {
            functions.push(...FunctionMapByPermission[permission]);
          });
          state.accessibleFunctions = functions;
        })
      ),
    setAsstPermAccessibleFunctions: (permissions: Permission[]) =>
      set(
        produce((state: IClassroomState) => {
          const functions: ClassroomFunction[] = [];
          permissions.forEach(permission => {
            functions.push(...FunctionMapByPermission[permission]);
          });
          state.asstAccessibleFunctions = functions;
        })
      ),
    setJoinedGroupId: (id: string) =>
      set(
        produce((state: IClassroomState) => {
          state.joinedGroupId = id;
        })
      ),

    setCommentInput: (text: string) =>
      set(
        produce((state: IClassroomState) => {
          state.commentInput = text;
        })
      ),

    setMessageList: (list: CommentMessage[]) =>
      set(
        produce((state: IClassroomState) => {
          state.messageList = list;
        })
      ),

    setGroupMuted: (bool: boolean) =>
      set(
        produce((state: IClassroomState) => {
          state.groupMuted = bool;
        })
      ),

    setSelfMuted: (bool: boolean) =>
      set(
        produce((state: IClassroomState) => {
          state.selfMuted = bool;
        })
      ),

    // pusher
    setSupportWebRTC: (bool: boolean) =>
      set(
        produce((state: IClassroomState) => {
          state.supportWebRTC = bool;
        })
      ),
    setMicrophoneEnable: (enable: boolean, fromInit = false) =>
      set(
        produce<IClassroomState>(state => {
          state.microphone.enable = enable;
          state.microphone.fromInit = fromInit;
        })
      ),
    setMicrophoneControlling: (controlling: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.microphone.controlling = controlling;
        })
      ),
    setMicrophoneDeviceCount: (count: number) =>
      set(
        produce<IClassroomState>(state => {
          state.microphone.deviceCount = count;
        })
      ),
    setMicrophoneDevice: (deviceId: string) =>
      set(
        produce<IClassroomState>(state => {
          state.microphone.deviceId = deviceId;
        })
      ),
    setMicrophoneTrackId: (trackId: string) =>
      set(
        produce<IClassroomState>(state => {
          state.microphone.trackId = trackId;
        })
      ),
    setCameraEnable: (enable: boolean, fromInit = false) =>
      set(
        produce<IClassroomState>(state => {
          state.camera.enable = enable;
          state.camera.fromInit = fromInit;
        })
      ),
    setCameraControlling: (controlling: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.camera.controlling = controlling;
        })
      ),
    setCameraDeviceCount: (count: number) =>
      set(
        produce<IClassroomState>(state => {
          state.camera.deviceCount = count;
        })
      ),
    setCameraDevice: (deviceId: string) =>
      set(
        produce<IClassroomState>(state => {
          if (state.camera.deviceId !== deviceId) {
            state.camera.size = DEFAULT_SIZE;
            state.camera.deviceId = deviceId;
          }
        })
      ),
    setCameraTrackId: (trackId: string) =>
      set(
        produce<IClassroomState>(state => {
          state.camera.trackId = trackId;
        })
      ),
    setDisplayEnable: (enable: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.display.enable = enable;
        })
      ),
    setDisplayDevice: (deviceId: string) =>
      set(
        produce<IClassroomState>(state => {
          state.display.deviceId = deviceId;
        })
      ),
    setDisplayState: (displayState: IDisplayState) =>
      set(
        produce<IClassroomState>(state => {
          const newData = {
            ...state.display,
            ...displayState,
          };
          state.display = newData;
        })
      ),
    setDisplayTrackId: (trackId: string, size?: StreamSize) =>
      set(
        produce<IClassroomState>(state => {
          state.display.trackId = trackId;
          state.display.size = size || DEFAULT_SIZE;
        })
      ),
    setPushing: (pushing: boolean, interrupted = false) =>
      set(
        produce<IClassroomState>(state => {
          state.pusher.pushing = pushing;
          state.pusher.interrupted = interrupted;
        })
      ),
    setPusherInterrupted: (interrupted = false) =>
      set(
        produce<IClassroomState>(state => {
          state.pusher.interrupted = interrupted;
        })
      ),
    setPusherExecuting: (bool: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.pusher.executing = bool;
        })
      ),
    setPusherTime: (time: Date) =>
      set(
        produce<IClassroomState>(state => {
          state.pusher.startTime = time;
        })
      ),
    setBoard: (info: IBoard) =>
      set(
        produce<IClassroomState>(state => {
          state.board = info;
        })
      ),
    setLocalMedia: (info: ILocalMedia) =>
      set(
        produce<IClassroomState>(state => {
          state.localMedia = info;
        })
      ),
    setLocalMediaStream: (stream?: MediaStream) =>
      set(
        produce<IClassroomState>(state => {
          state.localMedia.mediaStream = stream;
        })
      ),
    setLocalMediaSources: (sources: ILocalMediaSource[]) =>
      set(
        produce<IClassroomState>(state => {
          state.localMedia.sources = sources;
        })
      ),
    setDocsUpdateFlag: () =>
      set(
        produce<IClassroomState>(state => {
          state.docsUpdateFlag += 1;
        })
      ),
    // 更新邀请中的用户id
    updateInteractionInvitationUsers: (
      type: InteractionInvitationUpdateType,
      userId: string
    ) =>
      set(
        produce<IClassroomState>(state => {
          const arr = state.interactionInvitationUsers.slice();
          const index = arr.indexOf(userId);
          if (type === InteractionInvitationUpdateType.Add && index === -1) {
            arr.push(userId);
          } else if (
            type === InteractionInvitationUpdateType.Remove &&
            index !== -1
          ) {
            arr.splice(index, 1);
          }
          state.interactionInvitationUsers = arr;
        })
      ),
    // 更新申请连麦列表
    updateApplyingList: (userId: string, userInfo?: IUserInfo) =>
      set(
        produce<IClassroomState>(state => {
          const remove = !userInfo;
          const list = [...state.applyingList];
          const index = list.findIndex(
            ({ userId: _userId }) => _userId === userId
          );
          if (remove) {
            if (index > -1) list.splice(index, 1);
          } else {
            if (index > -1) {
              list.splice(index, 1, userInfo);
            } else {
              list.splice(0, 0, userInfo);
            }
          }
          state.applyingList = list;
        })
      ),
    // 连麦用户，包含老师、学生
    setConnectedSpectators: (arr: ISpectatorInfo[]) =>
      set(
        produce<IClassroomState>(state => {
          state.connectedSpectators = arr;
          state.interactionFull = arr.length >= MaxConnectedSpectatorNum;
        })
      ),
    // 更新连麦用户，包含老师、学生
    updateConnectedSpectator: (
      userId: string,
      userInfo?: Partial<ISpectatorInfo>,
      updateOnly = false
    ) =>
      set(
        produce<IClassroomState>(state => {
          const { memberList, connectedSpectators } = state;
          const remove = !userInfo;

          const list = [...connectedSpectators];
          const index = list.findIndex(item => item.userId === userId);

          const teacherId = state.classroomInfo.teacherId;
          if (remove) {
            if (index > -1) {
              list.splice(index, 1);
            }
          } else {
            if (index > -1) {
              list.splice(index, 1, {
                ...list[index],
                ...userInfo,
              });
            } else if (!updateOnly) {
              list.splice(0, 0, {
                ...userInfo,
                userNick: userInfo.userNick ?? userId,
                userId,
              });
            }
          }

          // 将老师放到连麦列表第一位
          const teacherIndex = list.findIndex(
            ({ userId }) => userId === teacherId
          );
          if (teacherIndex > -1) {
            const teacherInfo = list[teacherIndex];
            list.splice(teacherIndex, 1);
            list.splice(0, 0, teacherInfo);
          }

          state.connectedSpectators = list;
          state.interactionFull = list.length >= MaxConnectedSpectatorNum;
        })
      ),

    // 已开始连麦
    setInteracting: (bool: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.interacting = bool;
        })
      ),

    // 连麦启动中
    setInteractionStarting: (bool: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.interactionStarting = bool;
        })
      ),

    // 受控摄像头开启
    setControlledCameraOpened: (bool: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.controlledCameraOpened = bool;
        })
      ),

    // 受控麦克风开启
    setControlledMicOpened: (bool: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.controlledMicOpened = bool;
        })
      ),

    setMemberList: (memberList: IMemberInfo[]) =>
      set(
        produce<IClassroomState>(state => {
          state.memberList = memberList;
        })
      ),
    increaseMemberListFlag: () =>
      set(
        produce<IClassroomState>(state => {
          state.memberListFlag += 1;
        })
      ),

    setInteractionAllowed: (bool: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.interactionAllowed = bool;
        })
      ),

    setAllMicMuted: (bool: boolean) =>
      set(
        produce<IClassroomState>(state => {
          state.allMicMuted = bool;
        })
      ),
  }))
);

export default useClassroomStore;
