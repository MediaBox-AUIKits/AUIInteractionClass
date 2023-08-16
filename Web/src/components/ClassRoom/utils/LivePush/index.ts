import AlivcPusher from './AlivcPusher';
type SDKType = 'alivc';

class LivePushFactory {
  livePusher?: AlivcPusher;

  getInstance(type: SDKType = 'alivc') {
    if (type === 'alivc') {
      if (!this.livePusher) {
        const ins = new AlivcPusher();
        this.livePusher = ins;
      }

      return this.livePusher;
    }

    return null;
  }

  destroyInstance(type: SDKType = 'alivc') {
    if (type === 'alivc') {
      if (this.livePusher) {
        this.livePusher.destroy();
        this.livePusher = undefined;
      }
    }
  }
}

const factory = new LivePushFactory();

export default factory;
