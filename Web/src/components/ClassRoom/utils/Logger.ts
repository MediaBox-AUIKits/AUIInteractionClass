import { Reporter } from '@/utils/Reporter';
/**
 * 使用父组件传入的 report 函数上报日志
 */

export enum EMsgid {
  JOIN_CLASSROOM = 1001,
  JOIN_CLASSROOM_RESULT = 1002,
  INIT_CLASSROOM = 1003,
  INIT_CLASSROOM_RESULT = 1004,
  INIT_IM = 1005,
  INIT_IM_RESULT = 1006,
  AUI_MESSAGE_LOGIN = 1007,
  AUI_MESSAGE_LOGIN_RESULT = 1008,
  AUI_MESSAGE_JOIN_GROUP = 1009,
  AUI_MESSAGE_JOIN_GROUP_RESULT = 1010,
  INIT_MESSAGE_LIST = 1011,
  INIT_MESSAGE_LIST_RESULT = 1012,

  // 环境、媒体设备相关
  SYSTEM_REQUIREMENTS = 1101,
  MEDIA_DEVICE_PERMISSION = 1102,
  SCREEN_SHARE_SUPPORTED = 1103,
  START_MIC = 1104,
  START_MIC_RESULT = 1105,
  STOP_MIC = 1106,
  STOP_MIC_RESULT = 1107,
  START_CAMERA = 1108,
  START_CAMERA_RESULT = 1109,
  STOP_CAMERA = 1110,
  STOP_CAMERA_RESULT = 1111,
  START_SCREEN = 1112,
  START_SCREEN_RESULT = 1113,
  STOP_SCREEN = 1114,
  STOP_SCREEN_RESULT = 1115,

  // 课堂状态相关
  START_CLASS = 1201, // 上课
  START_CLASS_RESULT = 1202,
  STOP_CLASS = 1203, // 下课
  STOP_CLASS_RESULT = 1204,

  // 白板相关
  INIT_WHITE_BOARD = 1301,
  INIT_WHITE_BOARD_RESULT = 1302,
  JOIN_WHITE_BOARD_ROOM = 1303,
  JOIN_WHITE_BOARD_ROOM_RESULT = 1304,

  // 消息相关
  SEND_MESSAGE = 1401,
  SEND_MESSAGE_RESULT = 1402,
  REMOVE_MESSAGE = 1403,
  REMOVE_MESSAGE_RESULT = 1404,
  MUTE_GROUP = 1405,
  MUTE_GROUP_RESULT = 1406,
  SEND_INTERACTION_IM = 1407,
  SEND_INTERACTION_IM_RESULT = 1408,
  SEND_COOPERATION_IM = 1409,
  SEND_COOPERATION_IM_RESULT = 1410,

  // 推流相关
  CONNECTION_LOST = 1501,
  NETWORK_RECOVERY = 1502,
  RECONNECT_EXHAUSTED = 1503,
}

type ReportFunction = (msgId: number, data?: any) => void;
type ReportInfoFunction = (eventId: EMsgid, args?: Record<string, any>) => void;
type ReportInvokeFunction = (eventId: EMsgid, args?: any) => void;
type ReportInvokeResultFunction = (
  eventId: number,
  success: boolean,
  args?: any,
  error?: Error | AggregateError | unknown
) => void;

class Logger {
  report: ReportFunction;
  reportInfo: ReportInfoFunction;
  reportInvoke: ReportInvokeFunction;
  reportInvokeResult: ReportInvokeResultFunction;

  constructor() {
    this.report = () => {};
    this.reportInfo = () => {};
    this.reportInvoke = () => {};
    this.reportInvokeResult = () => {};
  }

  setReport(func: ReportFunction) {
    if (func) {
      this.report = func;
    }
  }

  setReporter(reporter: Reporter) {
    if (reporter) {
      this.reportInfo = reporter.reportInfo.bind(reporter);
      this.reportInvoke = reporter.reportInvoke.bind(reporter);
      this.reportInvokeResult = reporter.reportInvokeResult.bind(reporter);
    }
  }
}

const logger = new Logger();

export default logger;
