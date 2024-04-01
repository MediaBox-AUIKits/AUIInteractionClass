import {
  StreamHeight,
  StreamWidth,
  SubStreamHeight,
  SubStreamWidth,
  CameraResolution,
  CameraFps,
  ShadowCameraResolution,
  ShadowCameraFps,
  CameraWidth,
  CameraHeight,
  LiveTranscodingSourceType,
} from '../../constants';
import { checkSystemRequirements } from '../common';
import { getLayoutArray } from '../..//utils/common';

class AlivcPusher extends window.AlivcLivePush.AlivcLivePusher {
  shadowInstance?: any; // 用于大班课混流
  shadowSubSpecUserId?: string; // shadow 单流订阅的用户

  init(config: any = {}, shadowSubSpecUserId?: string) {
    this.shadowSubSpecUserId = shadowSubSpecUserId;

    return super.init({
      resolution: CameraResolution,
      fps: CameraFps,
      // 摄像头关闭时所推的静态帧
      cameraCloseImagePath:
        'https://img.alicdn.com/imgextra/i1/O1CN01tyOtvh1s7oMRG716S_!!6000000005720-0-tps-960-540.jpg',
      connectRetryCount: 12, // 网络异常重试次数
      logLevel: 2,
      instanceId: 'reality', // 主实例
      extraInfo: CONFIG?.auiScene && JSON.stringify(CONFIG?.auiScene),
      ...config,
    });
  }

  async initShadow() {
    if (this.shadowInstance) {
      return;
    }
    console.log('-----initShadow-----');
    this.shadowInstance = new window.AlivcLivePush.AlivcLivePusher();
    await this.shadowInstance.init({
      resolution: ShadowCameraResolution,
      fps: ShadowCameraFps,
      // 摄像头关闭时所推的静态帧
      cameraCloseImagePath:
        'https://img.alicdn.com/imgextra/i1/O1CN01tyOtvh1s7oMRG716S_!!6000000005720-0-tps-960-540.jpg',
      connectRetryCount: 12, // 网络异常重试次数
      logLevel: 1,
      instanceId: 'shadow', // 影子实例
      audio: false,
      video: false,
      screen: false,
      extraInfo: CONFIG?.auiScene && JSON.stringify(CONFIG?.auiScene),
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
        const stream = await navigator?.mediaDevices?.getUserMedia({
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
        const stream = await navigator?.mediaDevices?.getUserMedia({
          video: true,
        });
        ret.video = true;
        stream.getVideoTracks()[0].stop();
      } catch (error) {
        console.log('摄像头设备异常', error);
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

  updateTranscodingConfig(includeCamera = true) {
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
    // 指定旁路混流的分辨率
    config.width = StreamWidth;
    config.height = StreamHeight;
    // 指定旁路混流的码率
    config.bitrate = 3000;
    /**
     * 0 缩放，源流按比例缩放到窗格，与窗格中心点对齐，左右或者上下可能有黑边
     * 1 裁剪模式，源流填满窗格，与窗格中心点对齐
     * 2 拉伸模式，将源流按照窗格尺寸填满窗格，与窗格中心点对齐
     */
    config.cropMode = 0;
    config.mixStreams = mixStreams;

    // 若启用了 shadow，则由 shadow_shareScreen 流承载老师的「摄像头」+「白板/屏幕共享/本地插播」混流
    if (this.shadowInstance) {
      return this.shadowInstance.setLiveMixTranscodingConfig(config, {
        taskSourceType: LiveTranscodingSourceType.LiveTranscodingShareScreen,
      });
    }
    return super.setLiveMixTranscodingConfig(config);
  }

  resetTranscodingConfig() {
    if (this.shadowInstance) {
      return this.shadowInstance.setLiveMixTranscodingConfig(
        {},
        {
          taskSourceType: LiveTranscodingSourceType.LiveTranscodingShareScreen,
        }
      );
    }
    return super.setLiveMixTranscodingConfig();
  }

  updateInteractionMembersCameraLayout(users: { userId: string }[]) {
    const config = new window.AlivcLivePush.AlivcLiveTranscodingConfig();
    config.width = CameraWidth;
    config.height = CameraHeight;
    /**
     * 0 缩放，源流按比例缩放到窗格，与窗格中心点对齐，左右或者上下可能有黑边
     * 1 裁剪模式，源流填满窗格，与窗格中心点对齐
     * 2 拉伸模式，将源流按照窗格尺寸填满窗格，与窗格中心点对齐
     */
    config.cropMode = 0;
    config.mixStreams = getLayoutArray(
      users,
      CameraWidth,
      CameraHeight,
      16 / 9
    );

    if (this.shadowInstance) {
      return this.shadowInstance.setLiveMixTranscodingConfig(config);
    }
    return super.setLiveMixTranscodingConfig(config);
  }

  resetInteractionMembersCameraLayout() {
    if (this.shadowInstance) {
      return this.shadowInstance.setLiveMixTranscodingConfig(
        {},
        {
          subSpecUserId: this.shadowSubSpecUserId,
        }
      );
    }
    return super.setLiveMixTranscodingConfig();
  }

  async startPush(url: string, shadowUrl?: string) {
    if (shadowUrl && this.shadowInstance) {
      /**
       * 先启动 shadow 推 camera 流（之前实例化 pusher 的时候配置了摄像头流有默认占位图）；
       * 配置了旁路转推则会单路转推出 {主播userId}_shadow_camera 直播流
       */
      await this.shadowInstance.startPush(shadowUrl);
      /**
       * 再启动 shadow 推 shareScreen 流（暂无内容，先复制 shadow_camera 画面）；
       * 配置了旁路转推则会单路转推出 {userId}_shadow_camera 直播流
       */
      await this.shadowInstance.startCustomStream(
        this.shadowInstance.rtcEngineProxy.client.publishStream.mediaStream
      );
      // 把主播的 camera 流混到 shadow 的 camera 流上
      await this.shadowInstance.setLiveMixTranscodingConfig(
        {},
        {
          subSpecUserId: this.shadowSubSpecUserId,
        }
      );
    }
    // 启动主播推流；配置了旁路转推则会单路转推出 {userId}_shareScreen/{userId}_camera 流
    await super.startPush(url);
  }

  async stopPush() {
    await this.shadowInstance?.stopPush();
    await super.stopPush();
  }

  async destroy() {
    await this.shadowInstance?.destroy();
    await super.destroy();
  }
}

export default AlivcPusher;
