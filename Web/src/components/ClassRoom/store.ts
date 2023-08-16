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
} from './types';

const DEFAULT_SIZE = { width: 1280, height: 720 };

export const defaultClassroomInfo: IClassroomInfo = {
  id: '',
  boards: '{}',
  teacherId: '',
  teacherNick: '',
  chatId: '',
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
    },
  },
};

export const defaultClassroomState: IClassroomState = {
  classroomInfo: Object.assign({}, defaultClassroomInfo),
  joinedGroupId: '',
  messageList: [],
  commentInput: '',
  groupMuted: false,
  selfMuted: false,
  // pusher
  microphone: { enable: false, deviceCount: 0 },
  camera: { enable: false, deviceCount: 0 },
  display: { enable: false },
  pusher: { pushing: false, executing: false, interrupted: false },
  // 白板
  board: {},
};

const useClassroomStore = create(
  subscribeWithSelector<IClassroomState & ClassroomActions>((set) => ({
    ...defaultClassroomState,
    reset: () => set(() => ({
      ...defaultClassroomState,
    })),

    setClassroomInfo: (info: IClassroomInfo) =>
      set(
        produce((state: IClassroomState) => {
          state.classroomInfo = info;
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
    setMicrophoneEnable: (enable: boolean, fromInit = false) =>
      set(
        produce<IClassroomState>((state) => {
          state.microphone.enable = enable;
          state.microphone.fromInit = fromInit;
        })
      ),
    setMicrophoneDeviceCount: (count: number) =>
      set(
        produce<IClassroomState>((state) => {
          state.microphone.deviceCount = count;
        })
      ),
    setMicrophoneDevice: (deviceId: string) =>
      set(
        produce<IClassroomState>((state) => {
          state.microphone.deviceId = deviceId;
        })
      ),
    setMicrophoneTrackId: (trackId: string) =>
      set(
        produce<IClassroomState>((state) => {
          state.microphone.trackId = trackId;
        })
      ),
    setCameraEnable: (enable: boolean, fromInit = false) =>
      set(
        produce<IClassroomState>((state) => {
          state.camera.enable = enable;
          state.camera.fromInit = fromInit;
        })
      ),
    setCameraDeviceCount: (count: number) =>
      set(
        produce<IClassroomState>((state) => {
          state.camera.deviceCount = count;
        })
      ),
    setCameraDevice: (deviceId: string) =>
      set(
        produce<IClassroomState>((state) => {
          if (state.camera.deviceId !== deviceId) {
            state.camera.size = DEFAULT_SIZE;
            state.camera.deviceId = deviceId;
          }
        })
      ),
    setCameraTrackId: (trackId: string) =>
      set(
        produce<IClassroomState>((state) => {
          state.camera.trackId = trackId;
        })
      ),
    setDisplayEnable: (enable: boolean) =>
      set(
        produce<IClassroomState>((state) => {
          state.display.enable = enable;
        })
      ),
    setDisplayDevice: (deviceId: string) =>
      set(
        produce<IClassroomState>((state) => {
          state.display.deviceId = deviceId;
        })
      ),
    setDisplayState: (displayState: IDisplayState) =>
      set(
        produce<IClassroomState>((state) => {
          const newData = {
            ...state.display,
            ...displayState,
          }
          state.display = newData;
        })
      ),
    setDisplayTrackId: (
      trackId: string,
      size?: StreamSize
    ) =>
      set(
        produce<IClassroomState>((state) => {
          state.display.trackId = trackId;
          state.display.size = size || DEFAULT_SIZE;
        })
      ),
    setPushing: (pushing: boolean, interrupted = false) =>
      set(
        produce<IClassroomState>((state) => {
          state.pusher.pushing = pushing;
          state.pusher.interrupted = interrupted;
        })
      ),
    setPusherInterrupted: (interrupted = false) =>
      set(
        produce<IClassroomState>((state) => {
          state.pusher.interrupted = interrupted;
        })
      ),
    setPusherExecuting: (bool: boolean) =>
      set(
        produce<IClassroomState>((state) => {
          state.pusher.executing = bool;
        })
      ),
    setPusherTime: (time: Date) =>
      set(
        produce<IClassroomState>((state) => {
          state.pusher.startTime = time;
        })
      ),
    setBoard: (info: IBoard) =>
      set(
        produce<IClassroomState>((state) => {
          state.board = info;
        })
      ),
  }))
);

export default useClassroomStore;
