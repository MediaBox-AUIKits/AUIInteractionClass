import { UserRoleEnum, IClassroomInfo, IUserInfo, ISpectatorInfo } from './classroom';

export interface IClassroomServices {
  fetchClassroomInfo: () => Promise<IClassroomInfo>;
  fetchIMToken: (imServer: string[]) => Promise<{
    aliyunAccessToken?: string;
    rongCloudToken?: string;
    rongCloudAppKey?: string;
  }>;
  startClass: () => Promise<IClassroomInfo>;
  stopClass: () => Promise<void>;
  updateMeetingInfo: (list: ISpectatorInfo[]) => Promise<any>;
  getMeetingInfo: () => Promise<ISpectatorInfo[]>;
  getWhiteboardAuthInfo: () => Promise<{
    nonce: string,
    checksum: string,
    curTime: number;
  }>;
  queryDoc: () => Promise<any>;
  addDocs: (docInfo: {
    docId: string;
    serverType: number;
    data: string;
  }[]) => Promise<any>;
  deleteDocs: (docIds: string) => Promise<any>;
  isMuteChatroom: (chatroomId: string, serverType: string) => Promise<{ result: boolean }>;
  muteChatroom: (chatroomId: string, serverType: string) => Promise<{ result: boolean }>;
  cancelMuteChatroom: (chatroomId: string, serverType: string) => Promise<{ result: boolean }>;
  muteUser: (chatroomId: string, userId: string, minute: number, serverType: string) => Promise<{ result: boolean }>
  cancelMuteUser: (chatroomId: string, userId: string, serverType: string) => Promise<{ result: boolean }>;
}

export interface IClassRoomProps {
  role?: UserRoleEnum;
  userInfo: IUserInfo;
  id: string;
  services: IClassroomServices;
  report: (msgId: number, data?: any) => void;
  onExit: () => void;
}
