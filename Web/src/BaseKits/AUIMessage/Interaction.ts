import { InteractionEventNames, IMessageOptions, IMuteGroupReqModel, IGetMuteInfoReqModel, IGetMuteInfoRspModel, IListMessageReqModel } from './types';
import EventBus from './utils/EventBus';
const { InteractionEngine } = window.AliyunInteraction;

class Interaction extends EventBus {
  engine: InstanceType<typeof InteractionEngine>;

  constructor() {
    super();
    this.engine = InteractionEngine.create();
    this.engine.on(InteractionEventNames.Message, (eventData: any) => {
      this.emit('event', eventData || {});
    });
  }

  removeAllEvent() {
    this.engine.removeAllEvents();
    super.removeAllEvent();
  }

  muteGroup(options: IMuteGroupReqModel) {
    console.log('muteGroup', options);
    return this.engine.muteAll(options);
  }

  cancelMuteGroup(options: IMuteGroupReqModel) {
    return this.engine.cancelMuteAll(options);
  }

  getMuteInfo(options: IGetMuteInfoReqModel): Promise<IGetMuteInfoRspModel> {
    return new Promise((resolve, reject) => {
      this.engine.getGroupUserByIdList({
        groupId: options.groupId,
        userIdList: [options.userId],
      }).then((res: any) => {
        const info = ((res || {}).userList || [])[0] || {};
        const muteBy: string[] = info.muteBy || [];
        resolve({
          selfMuted: muteBy.includes('user'),
          groupMuted: muteBy.includes('group'),
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  sendMessageToGroup(options: IMessageOptions) {
    const params = {
      ...options,
      data: JSON.stringify(options.data),
    };
    return this.engine.sendMessageToGroup(params);
  }

  listMessage(options: IListMessageReqModel) {
    return this.engine
      .listMessage(options);
  }
}

export default Interaction;
