import { IClassroomInfo, IUserInfo, MeetingInfo } from './index';
import { Permission } from '@/types';
import { Reporter } from '@/utils/Reporter';
import { AUIMessageConfig } from '@/BaseKits/AUIMessage/types';

export interface IClassroomServices {
  fetchClassroomInfo: () => Promise<IClassroomInfo>;
  fetchAssistantPermissions: () => Promise<Permission[] | undefined>;
  fetchIMToken: (
    imServer: string[],
    role?: string
  ) => Promise<AUIMessageConfig>;
  startClass: () => Promise<IClassroomInfo>;
  stopClass: () => Promise<void>;
  updateMeetingInfo: (payload: Partial<MeetingInfo>) => Promise<any>;
  getMeetingInfo: () => Promise<MeetingInfo>;
  getWhiteboardAuthInfo: () => Promise<{
    nonce: string;
    checksum: string;
    curTime: number;
  }>;
  queryDoc: () => Promise<any>;
  addDocs: (
    docInfo: {
      docId: string;
      serverType: number;
      data: string;
    }[]
  ) => Promise<any>;
  deleteDocs: (docIds: string) => Promise<any>;
  isMuteChatroom: (
    chatroomId: string,
    serverType: string
  ) => Promise<{ result: boolean }>;
  muteChatroom: (
    chatroomId: string,
    serverType: string
  ) => Promise<{ result: boolean }>;
  cancelMuteChatroom: (
    chatroomId: string,
    serverType: string
  ) => Promise<{ result: boolean }>;
  muteUser: (
    chatroomId: string,
    userId: string,
    minute: number,
    serverType: string
  ) => Promise<{ result: boolean }>;
  cancelMuteUser: (
    chatroomId: string,
    userId: string,
    serverType: string
  ) => Promise<{ result: boolean }>;
  joinClass: () => Promise<any>;
  leaveClass: () => Promise<any>;
  kickClass: (userId: string) => Promise<any>;
  listMembers: (options: any) => Promise<any>;
}

export interface IClassRoomProps {
  userInfo: IUserInfo;
  id: string;
  // 用于学生端是否不加载白板组件，若为 true，将通过播放器播放白板流
  // 仅对非公开课模式的学生端生效
  whiteBoardHidden: boolean;
  services: IClassroomServices;
  reporter: Reporter;
  onExit: () => void;
}
