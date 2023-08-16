import { UserRoleEnum, IClassroomInfo } from './classroom';

export interface IUserInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface IClassroomServices {
  fetchClassroomInfo: () => Promise<IClassroomInfo>;
  fetchIMToken: () => Promise<string>;
  startClass: () => Promise<IClassroomInfo>;
  stopClass: () => Promise<void>;
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
}

export interface IClassRoomProps {
  role?: UserRoleEnum;
  userInfo: IUserInfo;
  id: string;
  services: IClassroomServices;
  report: (msgId: number, data?: any) => void;
  onExit: () => void;
}
