import { PlayerParams } from './player';

// H5自定义错误UI：https://help.aliyun.com/document_detail/63069.htm
// 配置skinLayout属性：https://help.aliyun.com/document_detail/62948.htm
export const EnterpriseSkinLayoutLive = [
  { name: 'bigPlayButton', align: 'cc' },
  { name: 'H5Loading', align: 'cc' },
  // 注释下一行 errorDisplay 以隐藏默认的报错信息
  { name: 'errorDisplay', align: 'tlabs', x: 0, y: 100 },
  {
    name: 'controlBar',
    align: 'blabs',
    x: 0,
    y: 0,
    children: [
      { name: 'liveDisplay', align: 'tlabs', x: 15, y: 6 },
      { name: 'fullScreenButton', align: 'tr', x: 10, y: 15 },
    ],
  },
];

export const EnterpriseSkinLayoutPlayback = [
  { name: 'bigPlayButton', align: 'cc' },
  { name: 'H5Loading', align: 'cc' },
  // 注释下一行 errorDisplay 以隐藏默认的报错信息
  { name: 'errorDisplay', align: 'tlabs', x: 0, y: 100 },
  {
    name: 'controlBar',
    align: 'blabs',
    x: 0,
    y: 0,
    children: [
      { name: 'progress', align: 'tlabs', x: 0, y: 0 },
      { name: 'playButton', align: 'tl', x: 20, y: 15 },
      { name: 'timeDisplay', align: 'tl', x: 20, y: 7 },
      { name: 'fullScreenButton', align: 'tr', x: 10, y: 15 },
    ],
  },
];

export const PCSkinLayoutLive = [
  { name: 'bigPlayButton', align: 'cc' },
  { name: 'H5Loading', align: 'cc' },
  { name: 'errorDisplay', align: 'tlabs', x: 0, y: 0 },
  { name: 'infoDisplay', align: 'cc' },
  {
    name: 'controlBar',
    align: 'blabs',
    x: 0,
    y: 0,
    children: [
      { name: 'liveDisplay', align: 'tlabs', x: 15, y: 6 },
      { name: 'fullScreenButton', align: 'tr', x: 10, y: 10 },
      { name: 'volume', align: 'tr', x: 5, y: 10 },
    ],
  },
];

export const PCSkinLayoutPlayback = [
  { name: 'bigPlayButton', align: 'cc' },
  { name: 'H5Loading', align: 'cc' },
  { name: 'errorDisplay', align: 'tlabs', x: 0, y: 100 },
  { name: 'infoDisplay' },
  { name: 'thumbnail' },
  { name: 'tooltip', align: 'blabs', x: 0, y: 56 },
  {
    name: 'controlBar',
    align: 'blabs',
    x: 0,
    y: 0,
    children: [
      { name: 'progress', align: 'blabs', x: 0, y: 44 },
      { name: 'playButton', align: 'tl', x: 15, y: 12 },
      { name: 'timeDisplay', align: 'tl', x: 10, y: 7 },
      { name: 'fullScreenButton', align: 'tr', x: 10, y: 12 },
      { name: 'setting', align: 'tr', x: 15, y: 12 },
      { name: 'volume', align: 'tr', x: 5, y: 10 },
    ],
  },
];

// 最大重试次数
const MAX_RETRY_COUNT = 5;
// 重试时间间隔
const RETRY_INTERVAL = 2000;

(window as any).Aliplayer.__logCallback__ = function (event: any) {
  if (CONFIG?.auiScene) event.extra = JSON.stringify(CONFIG?.auiScene);
};

export class LiveService {
  private playerMap: Map<number | string, any> = new Map();
  private currentInstanceId?: number | string;
  private source?: string;
  private retryCount = 0;

  get player() {
    if (this.currentInstanceId)
      return this.playerMap.get(this.currentInstanceId);
  }

  public getPlayerComponent(name: string) {
    return this.player?.getComponent(name);
  }

  public play(
    config: Partial<PlayerParams>,
    playerInstanceId: string | number = +new Date()
  ) {
    const options: PlayerParams = {
      id: 'player',
      isLive: true,
      width: '100%',
      height: '100%',
      autoplay: true,
      rePlay: false,
      playsinline: true,
      preload: true,
      controlBarVisibility: 'never',
      useH5Prism: true,
      rtsSdkUrl:
        'https://g.alicdn.com/apsara-media-box/imp-web-rts-sdk/2.6.2/aliyun-rts-sdk.js',
      ...config,
    };

    if (!options.skinLayout) {
      options.skinLayout = EnterpriseSkinLayoutLive;
    }
    this.source = options.source;

    this.currentInstanceId = playerInstanceId;
    const player = new window.Aliplayer(options);

    if (!this.playerMap.get(playerInstanceId)) {
      this.playerMap.set(playerInstanceId, player);
    }

    player.on('error', (e: any) => {
      // 处理 4004 逻辑（一般是因为 HLS 有延时，推流已经开始但播流还拉不到），自动重试
      if (
        e.paramData.error_code === 4004 &&
        this.retryCount < MAX_RETRY_COUNT
      ) {
        window.setTimeout(() => {
          this.retryCount++;
          player?.loadByUrl(this.source || '', 0, true, true);
        }, RETRY_INTERVAL);
      }
    });
  }

  public playback(
    config: Partial<PlayerParams>,
    playerInstanceId = +new Date()
  ) {
    const options: PlayerParams = {
      id: 'player',
      width: '100%',
      height: '100%',
      autoplay: true,
      playsinline: true,
      preload: true,
      controlBarVisibility: 'always',
      useH5Prism: true,
      keyShortCuts: true,
      keyFastForwardStep: 5,
      ...config,
    };

    if (!options.skinLayout) {
      options.skinLayout = EnterpriseSkinLayoutPlayback;
    }

    this.currentInstanceId = playerInstanceId;
    const player = new window.Aliplayer(options);
    if (!this.playerMap.get(playerInstanceId)) {
      this.playerMap.set(playerInstanceId, player);
    }
  }

  public mute() {
    this.player?.mute();
  }

  public pause() {
    if (this.player) {
      this.player.pause(true);
    }
  }

  public on(eventName: string, callback: Function) {
    if (this.player) {
      this.player.on(eventName, callback);
    }
  }

  public off(eventName: string, callback: Function) {
    if (this.player) {
      this.player.off(eventName, callback);
    }
  }

  public destroy(playerInstanceId?: number | string) {
    if (playerInstanceId !== undefined) {
      const player = this.playerMap.get(playerInstanceId);
      if (player) {
        player.dispose();
        this.playerMap.delete(playerInstanceId);
      }
    }
  }
}
