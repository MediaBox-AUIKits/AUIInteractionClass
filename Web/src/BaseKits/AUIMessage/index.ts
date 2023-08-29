import { v4 as uuidv4 } from 'uuid';
import Interaction from './Interaction';
import RongIM from './RongIM';
import {
  AUIMessageConfig,
  AUIMessageUserInfo,
  InteractionMessageTypes,
  AUIMessageEvents,
  IMessageOptions,
  IMuteGroupReqModel,
  IGetMuteInfoRspModel,
  IListMessageReqModel,
  IListMessageRspModel,
} from './types';
import EventBus from './utils/EventBus';

interface IMServerProps {
  aliyun?: {
    enable: boolean; // 是否开启阿里云互动消息服务
    primary?: boolean; // 是否是主消息服务
  };
  rongCloud?: {
    enable: boolean; // 是否开启融云互动消息服务
    appKey: string; // 融云的AppKey，用于初始化
    primary?: boolean; // 是否是主消息服务
  };
}

class AUIMessage extends EventBus {
  private interaction?: Interaction;
  private rongIM?: RongIM;
  private primaryIns?: Interaction | RongIM;
  private instances: (Interaction | RongIM)[];
  private config?: AUIMessageConfig;
  private userInfo?: AUIMessageUserInfo;
  private sidSet = new Set<string>();
  private groupMuted = false;
  public isLogin = false; // 是否已登录

  constructor(serverProps: IMServerProps) {
    super();
    const instances: (Interaction | RongIM)[] = [];
    if (serverProps.aliyun && serverProps.aliyun.enable) {
      this.interaction = new Interaction();
      this.interaction.addListener(
        'event',
        this.handleInteractionMessage.bind(this)
      );
      instances.push(this.interaction);
      if (serverProps.aliyun.primary) {
        this.primaryIns = this.interaction;
      }
    }
    if (
      serverProps.rongCloud &&
      serverProps.rongCloud.enable &&
      serverProps.rongCloud.appKey
    ) {
      // 初始化
      this.rongIM = new RongIM(serverProps.rongCloud.appKey);
      this.rongIM.addListener(
        'event',
        this.handleInteractionMessage.bind(this),
      );
      if (serverProps.rongCloud.primary) {
        this.primaryIns = this.rongIM;
        instances.unshift(this.rongIM);
      } else {
        instances.push(this.rongIM);
      }
    }
    this.instances = instances;
    if (!this.primaryIns) {
      this.primaryIns = this.interaction || this.rongIM;
    }
  }

  get rongCloundIM() {
    return this.rongIM;
  }

  private handleInteractionMessage(eventData: any) {
    console.log('收到信息', eventData);
    const { type, data, messageId } = eventData || {};
    const { sid } = data || {};
    if (sid) {
      if (this.sidSet.has(sid)) {
        return;
      }
      this.sidSet.add(sid);
    }

    switch (type) {
      case InteractionMessageTypes.PaaSUserJoin:
        this.emit(AUIMessageEvents.onJoinGroup, eventData);
        break;
      case InteractionMessageTypes.PaaSUserLeave:
        this.emit(AUIMessageEvents.onLeaveGroup, eventData);
        break;
      case InteractionMessageTypes.PaaSMuteGroup:
        if (this.groupMuted) {
          return;
        }
        this.groupMuted = true;
        this.emit(AUIMessageEvents.onMuteGroup, eventData);
        break;
      case InteractionMessageTypes.PaaSCancelMuteGroup:
        if (!this.groupMuted) {
          return;
        }
        this.groupMuted = false;
        this.emit(AUIMessageEvents.onUnmuteGroup, eventData);
        break;
      case InteractionMessageTypes.PaaSMuteUser:
        this.emit(AUIMessageEvents.onMuteUser, eventData);
        break;
      case InteractionMessageTypes.PaaSCancelMuteUser:
        this.emit(AUIMessageEvents.onUnmuteUser, eventData);
        break;
      default:
        this.emit(AUIMessageEvents.onMessageReceived, eventData);
        break;
    }
  }

  setConfig(config: AUIMessageConfig) {
    this.config = config;
    this.instances.forEach(ins => ins.setConfig(config));
  }

  login(userInfo: AUIMessageUserInfo) {
    if (!this.config) {
      return Promise.reject({
        code: -1,
        message: 'please set config first',
      });
    }

    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map(ins => ins.login(userInfo));
      Promise.all(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  logout() {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map(ins => ins.logout());
      Promise.all(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  joinGroup(groupId?: string, rongId?: string) {
    return new Promise<void>((resolve, reject) => {
      const list = [];
      if (this.interaction && groupId) {
        const p1 = this.interaction.joinGroup(groupId);
        list.push(p1);
      }
      if (this.rongIM && rongId) {
        const p2 = this.rongIM.joinGroup(rongId);
        list.push(p2);
      }
      Promise.all(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  leaveGroup() {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map(ins => ins.leaveGroup());
      Promise.all(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  muteGroup() {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map(ins => ins.muteGroup());
      Promise.any(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  cancelMuteGroup() {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map(ins => ins.cancelMuteGroup());
      Promise.any(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  muteUser(userId: string) {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map(ins => ins.muteUser(userId));
      Promise.any(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  cancelMuteUser(userId: string) {
    return new Promise<void>((resolve, reject) => {
      const list = this.instances.map(ins => ins.cancelMuteUser(userId));
      Promise.any(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  queryMuteGroup(): Promise<any> {
    if (!this.primaryIns) {
      throw new Error('primary im server is empty');
    }
    return this.primaryIns.queryMuteGroup();
  }

  sendMessageToGroup(options: IMessageOptions) {
    return new Promise<void>((resolve, reject) => {
      const sid = uuidv4();
      options.data = {
        ...(options.data || {}),
        sid,
      };
      const list = this.instances.map(ins => ins.sendMessageToGroup(options));
      Promise.any(list)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  listMessage(type: number) {
    if (!this.primaryIns) {
      throw new Error('primary im server is empty');
    }
    return this.primaryIns.listMessage(type);
  }
}

export default AUIMessage;

export * from './types';
