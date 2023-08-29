import {
  AUIMessageConfig,
  AUIMessageUserInfo,
  InteractionEventNames,
  IMessageOptions,
  IMuteGroupReqModel,
  IMMuteUserReqModel,
  IGetMuteInfoReqModel,
  IGetMuteInfoRspModel,
  IListMessageReqModel,
} from './types';
import EventBus from './utils/EventBus';
const { InteractionEngine } = window.AliyunInteraction;

class Interaction extends EventBus {
  engine: InstanceType<typeof InteractionEngine>;
  private config?: AUIMessageConfig;
  private userInfo?: AUIMessageUserInfo;
  private joinedGroupId?: string;

  constructor() {
    super();
    this.engine = InteractionEngine.create();
    this.engine.on(InteractionEventNames.Message, (eventData: any) => {
      this.emit('event', eventData || {});
    });
  }

  setConfig(config: AUIMessageConfig) {
    this.config = config;
  }

  login(userInfo: AUIMessageUserInfo) {
    return new Promise((resolve, reject) => {
      if (!this.config || !this.config.aliyunAccessToken) {
        reject('please set config first');
        return;
      }
      this.userInfo = userInfo;
      const { aliyunAccessToken } = this.config;
      this.engine
        .auth(aliyunAccessToken)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  logout() {
    return this.engine.logout();
  }

  removeAllEvent() {
    this.engine.removeAllEvents();
    super.removeAllEvent();
  }

  joinGroup(groupId: string) {
    return new Promise((resolve, reject) => {
      this.engine
        .joinGroup({
          groupId,
          userNick: this.userInfo?.userNick,
          userAvatar: this.userInfo?.userAvatar,
          broadCastStatistics: true,
          broadCastType: 2,
        })
        .then(res => {
          this.joinedGroupId = groupId;
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  leaveGroup() {
    if (!this.joinedGroupId) {
      return Promise.resolve(true);
    }
    const groupId = this.joinedGroupId;
    return new Promise((resolve, reject) => {
      this.engine
        .leaveGroup({ groupId, broadCastType: 2 })
        .then(res => {
          this.joinedGroupId = '';
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  muteGroup() {
    const params: IMuteGroupReqModel = {
      groupId: this.joinedGroupId,
      broadCastType: 2,
    }
    return this.engine.muteAll(params);
  }

  cancelMuteGroup() {
    const params: IMuteGroupReqModel = {
      groupId: this.joinedGroupId,
      broadCastType: 2,
    }
    return this.engine.cancelMuteAll(params);
  }

  muteUser(userId: string) {
    const params: IMMuteUserReqModel = {
      groupId: this.joinedGroupId,
      muteUserList: [userId],
      broadCastType: 1,
    };
    return this.engine.muteUser(params);
  }

  cancelMuteUser(userId: string) {
    const params = {
      groupId: this.joinedGroupId,
      cancelMuteUserList: [userId],
      broadCastType: 1,
    };
    return this.engine.cancelMuteUser(params);
  }

  queryMuteGroup(): Promise<IGetMuteInfoRspModel> {
    return new Promise((resolve, reject) => {
      this.engine
        .getGroupUserByIdList({
          groupId: this.joinedGroupId,
          userIdList: [this.userInfo?.userId || ''],
        })
        .then((res: any) => {
          const info = ((res || {}).userList || [])[0] || {};
          const muteBy: string[] = info.muteBy || [];
          resolve({
            selfMuted: muteBy.includes('user'),
            groupMuted: muteBy.includes('group'),
          });
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  sendMessageToGroup(options: IMessageOptions) {
    const params = {
      ...options,
      groupId: this.joinedGroupId,
      data: JSON.stringify(options.data),
    };
    return this.engine.sendMessageToGroup(params);
  }

  // 先支持发单人的，不支持发多人
  sendMessageToGroupUser(options: IMessageOptions) {
    const params = {
      ...options,
      groupId: this.joinedGroupId,
      receiverIdList: options.receiverId ? [options.receiverId] : undefined,
      data: JSON.stringify(options.data),
    };
    return this.engine.sendMessageToGroupUsers(params);
  }

  listMessage(type: number) {
    const params = {
      groupId: this.joinedGroupId,
      type,
      sortType: 0,
      pageNum: 1,
      pageSize: 20,
    };
    return this.engine.listMessage(params);
  }
}

export default Interaction;
