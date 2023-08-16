/**
 * 使用父组件传入的 report 函数上报日志
 */

export enum EMsgid {
  ENTER_CLASSROOM = 1001,
  INIT_CLASSROOM_ERROR = 1002,
  INIT_MESSAGE_LIST_ERROR = 1003,
  // 环境、媒体设备相关
  SYSTEM_REQUIREMENTS = 1101,
  MEDIA_DEVICE_PERMISSION = 1102,
  SCREEN_SHARE_SUPPORTED = 1103,
  START_MIC = 1104,
  START_MIC_ERROR = 1105,
  STOP_MIC = 1106,
  STOP_MIC_ERROR = 1107,
  START_CAMERA = 1108,
  START_CAMERA_ERROR = 1109,
  STOP_CAMERA = 1110,
  STOP_CAMERA_ERROR = 1111,
  START_SCREEN = 1112,
  START_SCREEN_ERROR = 1113,
  STOP_SCREEN = 1114,
  STOP_SCREEN_ERROR = 1115,
  // 推拉流相关
  START_CLASS = 1201, // 上课
  START_CLASS_ERROR = 1202,
  STOP_CLASS = 1203, // 下课
  STOP_CLASS_ERROR = 1204,
  CONNECTION_LOST = 1205,
  NETWORK_RECOVERY = 1206,
  RECONNECT_EXHAUSTED = 1207,
  // 白板相关
  INIT_WHITE_BOARD = 1301,
  INIT_WHITE_BOARD_ERROR = 1302,
  JOIN_WHITE_BOARD_ROOM_ERROR = 1303,
  // 消息相关
  SEND_MESSAGE_ERROR = 1401,
  MUTE_GROUP_ERROR = 1402,
  CANCEL_MUTE_GROUP_ERROR = 1403,
}

type ReportFunction = (msgId: number, data?: any) => void;

class Logger {
  report: ReportFunction;

  constructor() {
    this.report = () => { };
  }

  setReport(func: ReportFunction) {
    if (func) {
      this.report = func;
    }
  }

  enter() {
    this.report(EMsgid.ENTER_CLASSROOM);
  }

  initError(data: any) {
    this.report(EMsgid.INIT_CLASSROOM_ERROR, data);
  }

  initMessageListError(data: any) {
    this.report(EMsgid.INIT_MESSAGE_LIST_ERROR, data);
  }

  systemRequirements(data: any) {
    this.report(EMsgid.SYSTEM_REQUIREMENTS, data);
  }

  mediaDevicePermission(data: any) {
    this.report(EMsgid.MEDIA_DEVICE_PERMISSION, data);
  }

  screenShareSupported(supported: boolean) {
    this.report(EMsgid.SCREEN_SHARE_SUPPORTED, { supported });
  }

  startMic() {
    this.report(EMsgid.START_MIC);
  }

  startMicError(err: any) {
    this.report(EMsgid.START_MIC_ERROR, err);
  }

  stopMic() {
    this.report(EMsgid.STOP_MIC);
  }

  stopMicError(err: any) {
    this.report(EMsgid.STOP_MIC_ERROR, err);
  }

  startCamera() {
    this.report(EMsgid.START_CAMERA);
  }

  startCameraError(err: any) {
    this.report(EMsgid.START_CAMERA_ERROR, err);
  }

  stopCamera() {
    this.report(EMsgid.STOP_CAMERA);
  }

  stopCameraError(err: any) {
    this.report(EMsgid.STOP_CAMERA_ERROR, err);
  }

  startScreen() {
    this.report(EMsgid.START_SCREEN);
  }

  startScreenError(err: any) {
    this.report(EMsgid.START_SCREEN_ERROR, err);
  }

  stopScreen() {
    this.report(EMsgid.STOP_SCREEN);
  }

  stopScreenError(err: any) {
    this.report(EMsgid.STOP_SCREEN_ERROR, err);
  }

  startClass() {
    this.report(EMsgid.START_CLASS);
  }

  startClassError(err: any) {
    this.report(EMsgid.START_CLASS_ERROR, err);
  }

  stopClass() {
    this.report(EMsgid.STOP_CLASS);
  }

  stopClassError(err: any) {
    this.report(EMsgid.STOP_CLASS_ERROR, err);
  }

  connectionLost() {
    this.report(EMsgid.CONNECTION_LOST);
  }

  networkRecovery() {
    this.report(EMsgid.NETWORK_RECOVERY);
  }

  reconnectExhausted() {
    this.report(EMsgid.RECONNECT_EXHAUSTED);
  }

  initWhiteBoard() {
    this.report(EMsgid.INIT_WHITE_BOARD);
  }

  initWhiteBoardError(err: any) {
    this.report(EMsgid.INIT_WHITE_BOARD_ERROR, err);
  }

  joinWhiteBoardRoomError(err: any) {
    this.report(EMsgid.JOIN_WHITE_BOARD_ROOM_ERROR, err);
  }

  muteGroupError(err: any) {
    this.report(EMsgid.MUTE_GROUP_ERROR, err);
  }

  cancelMuteGroupError(err: any) {
    this.report(EMsgid.CANCEL_MUTE_GROUP_ERROR, err);
  }

  sendMessageError(err: any) {
    this.report(EMsgid.SEND_MESSAGE_ERROR, err);
  }
}

const logger = new Logger();

export default logger;
