export const StreamWidth = 1920;
export const StreamHeight = 1080;

export const SubStreamWidth = 480;
export const SubStreamHeight = 270;

export const CameraFps = window.AlivcLivePush.AlivcFpsEnum.FPS_30;
export const CameraResolution =
  window.AlivcLivePush.AlivcResolutionEnum.RESOLUTION_540P;
export const CameraWidth =
  window.AlivcLivePush.AlivcResolution.GetResolutionWidth(CameraResolution);
export const CameraHeight =
  window.AlivcLivePush.AlivcResolution.GetResolutionHeight(CameraResolution);

export const ShadowCameraFps = window.AlivcLivePush.AlivcFpsEnum.FPS_10;
export const ShadowCameraResolution =
  window.AlivcLivePush.AlivcResolutionEnum.RESOLUTION_180P;

export const PreviewPlayerId = 'selfPlayer';

// 网易白板sdk的版本号
export const NeteaseSDKVersion = '3.9.10';

// 连麦用户最大数量
export const MaxConnectedSpectatorNum = 9;

export enum LiveTranscodingSourceType {
  /*! 相机流 */
  LiveTranscodingCamera = 0,
  /*! 屏幕流 */
  LiveTranscodingShareScreen = 1,
}
