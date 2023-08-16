import { v4 as uuidv4 } from 'uuid';
import Interaction from "./Interaction";
import { AUIMessageConfig, AUIMessageUserInfo, InteractionMessageTypes, AUIMessageEvents, IMessageOptions, IMuteGroupReqModel, IGetMuteInfoRspModel, IListMessageReqModel, IListMessageRspModel } from './types';
import EventBus from './utils/EventBus';

enum ServiceTypes {
  Interaction = 'interaction',
  Rong = 'rong',
}
type ServiceType = `${ServiceTypes}`;

interface ServiceProps {
  type: ServiceType,
  options?: any; // 预留字段
}

class AUIMessage extends EventBus {
  private interaction?: Interaction;
  private instances: (Interaction)[];
  private config?: AUIMessageConfig;
  private userInfo?: AUIMessageUserInfo
  public isLogin = false; // 是否已登录

  constructor(serviceList: ServiceProps[]) {
    super();
    const instances: (Interaction)[] = [];
    serviceList.forEach((item) => {
      if (item.type === ServiceTypes.Interaction) {
        this.interaction = new Interaction();
        this.interaction.addListener('event', this.handleInteractionMessage.bind(this));
        instances.push(this.interaction);
      }
    });
    this.instances = instances;
  }

  private handleInteractionMessage(eventData: any) {
    console.log('收到互动信息', eventData);
    const { type, data, messageId } = eventData || {};

    switch (type) {
      case InteractionMessageTypes.PaaSUserJoin:
        this.emit(AUIMessageEvents.onJoinGroup, eventData);
        break;
      case InteractionMessageTypes.PaaSUserLeave:
        this.emit(AUIMessageEvents.onLeaveGroup, eventData);
        break;
      case InteractionMessageTypes.PaaSMuteGroup:
        this.emit(AUIMessageEvents.onMuteGroup, eventData);
        break;
      case InteractionMessageTypes.PaaSCancelMuteGroup:
        this.emit(AUIMessageEvents.onUnmuteGroup, eventData);
        break;
      default:
        this.emit(AUIMessageEvents.onMessageReceived, eventData);
        break;
    }
  }

  setConfig(config: AUIMessageConfig) {
    this.config = config;
  }

  login(userInfo: AUIMessageUserInfo) {
    return new Promise((resolve, reject) => {
      if (!this.config || !this.config.token) {
        reject('please set config first');
        return;
      }
      this.userInfo = userInfo;
      const { token } = this.config;
      if (this.interaction) {
        this.interaction.engine.auth(token).then((res) => {
          this.isLogin = true;
          resolve(res);
        }).catch((err) => {
          reject(err);
        })
      }
    });
  }

  logout() {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map((ins) => ins.engine.logout());
      Promise.all(list).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  joinGroup(groupId: string) {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map((ins) => ins.engine.joinGroup({
        groupId,
        userNick: this.userInfo?.userNick,
        userAvatar: this.userInfo?.userAvatar,
        broadCastStatistics: true,
        broadCastType: 2,
      }));
      Promise.any(list).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  leaveGroup(groupId: string) {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map((ins) => ins.engine.leaveGroup({ groupId }));
      Promise.all(list).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  muteGroup(options: IMuteGroupReqModel) {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map((ins) => ins.muteGroup(options));
      Promise.any(list).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  cancelMuteGroup(options: IMuteGroupReqModel) {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map((ins) => ins.cancelMuteGroup(options));
      Promise.any(list).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  getMuteInfo(groupId: string): Promise<IGetMuteInfoRspModel> {
    return new Promise<IGetMuteInfoRspModel>((resolve, reject) => {
      const list = this.instances.map((ins) => ins.getMuteInfo({
        groupId,
        userId: this.userInfo?.userId || '',
      }));
      Promise.any(list).then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  sendMessageToGroup(options: IMessageOptions) {
    return new Promise<void>((resolve, reject) => {
      const sid = uuidv4();
      options.data = {
        ...(options.data || {}),
        sid,
      };
      const list = this.instances.map((ins) => ins.sendMessageToGroup(options));
      Promise.any(list).then(() => {
        // 有一个发送成功都算成功
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  listMessage(options: IListMessageReqModel) {
    return new Promise<IListMessageRspModel>((resolve, reject) => {
      const list = this.instances.map((ins) => ins.listMessage(options));
      Promise.any(list).then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

export default AUIMessage;

export * from './types';
