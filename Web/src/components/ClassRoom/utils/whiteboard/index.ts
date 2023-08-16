import NetEase from "./netease";

class WhiteBoardFactory {
  netease?: NetEase;

  constructor() {
    //
  }

  getInstance(type: string) {
    if (type === 'netease') {
      if (!this.netease) {
        const ins = new NetEase();
        this.netease = ins;
      }

      return this.netease;
    }

    return null;
  }

  destroyInstance(type: string) {
    if (type === 'netease') {
      if (this.netease) {
        this.netease.destroy();
        this.netease = undefined;
      }
    }
  }
}

const factory = new WhiteBoardFactory();

export default factory;
