import {
  StreamHeight,
  StreamWidth,
  SubStreamHeight,
  SubStreamWidth,
} from '../../constances';
import { checkSystemRequirements } from '../common';

class AlivcPusher extends window.AlivcLivePush.AlivcLivePusher {
  shadowInstance?: any; // 用于大班课混流

  init() {
    return super.init({
      resolution: window.AlivcLivePush.AlivcResolutionEnum.RESOLUTION_540P,
      fps: window.AlivcLivePush.AlivcFpsEnum.FPS_30,
      // 摄像头关闭时所推的静态帧
      cameraCloseImagePath:
        'https://img.alicdn.com/imgextra/i1/O1CN01tyOtvh1s7oMRG716S_!!6000000005720-0-tps-960-540.jpg',
      connectRetryCount: 12, // 网络异常重试次数
      logLevel: 1,
      instanceId: 'reality', // 主实例
    });
  }

  initShadow() {
    if (this.shadowInstance) {
      return;
    }
    console.log('-----initShadow-----');
    this.shadowInstance = new window.AlivcLivePush.AlivcLivePusher();
    this.shadowInstance.init({
      resolution: window.AlivcLivePush.AlivcResolutionEnum.RESOLUTION_180P,
      fps: window.AlivcLivePush.AlivcFpsEnum.FPS_10,
      // 摄像头关闭时所推的静态帧
      cameraCloseImagePath:
        'https://img.alicdn.com/imgextra/i1/O1CN01tyOtvh1s7oMRG716S_!!6000000005720-0-tps-960-540.jpg',
      connectRetryCount: 12, // 网络异常重试次数
      logLevel: 1,
      instanceId: 'shadow', // 影子实例
      audio: false,
      video: false,
      screen: false,
    });
  }

  checkSystemRequirements = checkSystemRequirements;

  checkScreenShareSupported() {
    return window.AlivcLivePush.AlivcLivePusher.checkScreenShareSupported();
  }

  async checkMediaDevicePermission(options: {
    audio?: boolean;
    video?: boolean;
  }) {
    const ret: {
      audio?: boolean;
      video?: boolean;
    } = {};
    if (options.audio) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        ret.audio = true;
        stream.getAudioTracks()[0].stop();
      } catch (error) {
        console.log('麦克风设备异常', error);
        ret.audio = false;
      }
    }
    if (options.video) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        ret.video = true;
        stream.getVideoTracks()[0].stop();
      } catch (error) {
        console.log('麦克风设备异常', error);
        ret.video = false;
      }
    }

    return ret;
  }

  getMicrophones() {
    return window.AlivcLivePush.AlivcLivePusher.getMicrophones();
  }

  getCameras() {
    return window.AlivcLivePush.AlivcLivePusher.getCameras();
  }

  updateTrancodingConfig(includeCamera = true) {
    const uid = super.getUserId(); // 当前推流用户id
    if (!uid) {
      return Promise.resolve();
    }
    const mixStreams: any[] = [];
    // 白板或屏幕分享为主画面
    const mainStream = new window.AlivcLivePush.AlivcLiveMixStream(
      uid, // 当前推流用户id
      0,
      0,
      StreamWidth,
      StreamHeight,
      1, // 层级
      1 // 1: 辅流，0: 主流（即摄像头流）
    );
    mixStreams.push(mainStream);

    if (includeCamera) {
      // 摄像头流在右上角
      const subStream = new window.AlivcLivePush.AlivcLiveMixStream(
        uid, // 当前推流用户id
        StreamWidth - SubStreamWidth,
        0,
        SubStreamWidth,
        SubStreamHeight,
        2,
        0
      );
      mixStreams.push(subStream);
    }

    // 更新混流布局
    const config = new window.AlivcLivePush.AlivcLiveTranscodingConfig();
    config.width = StreamWidth;
    config.height = StreamHeight;
    config.cropMode = 2;
    config.mixStreams = mixStreams;

    if (this.shadowInstance) {
      return this.shadowInstance.setLiveMixTranscodingConfig(config);
    }
    return super.setLiveMixTranscodingConfig(config);
  }

  resetTrancodingConfig() {
    if (this.shadowInstance) {
      return this.shadowInstance.setLiveMixTranscodingConfig();
    }
    return super.setLiveMixTranscodingConfig();
  }

  async startPush(url: string, shadowUrl?: string) {
    if (shadowUrl && this.shadowInstance) {
      await this.shadowInstance.startPush(shadowUrl);
    }
    await super.startPush(url);
  }

  async stopPush() {
    if (this.shadowInstance) {
      await this.shadowInstance.stopPush();
    }
    await super.stopPush();
  }

  destroy() {
    if (this.shadowInstance) {
      this.shadowInstance.destroy();
    }
    super.destroy();
  }
}

export default AlivcPusher;
