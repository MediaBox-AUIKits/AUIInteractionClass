// 配置 APPServer 服务域名
export const ServicesOrigin = CONFIG?.appServer?.origin;

// 配置api接口路径前缀
export const ApiPrefixPath = CONFIG?.appServer?.apiPrefixPath;

export const RequestBaseUrl = `${ServicesOrigin}${ApiPrefixPath}`;

// api名
export enum ApiNames {
  login = '/v1/class/login',
  token = '/v2/class/token',
  create = '/v2/class/create',
  list = '/v1/class/list',
  get = '/v1/class/get',
  start = '/v1/class/start',
  stop = '/v1/class/stop',
  getMeetingInfo = '/v1/class/getMeetingInfo',
  updateMeetingInfo = '/v1/class/updateMeetingInfo',
  wbAuth = '/v1/class/getWhiteboardAuthInfo',
  queryDoc = '/v1/class/queryDoc',
  deleteDocs = '/v1/class/deleteDocs',
  addDocs = '/v1/class/addDocs',
  isMuteChatroom = '/v1/class/isMuteChatroom',
  muteChatroom = '/v1/class/muteChatroom',
  cancelMuteChatroom = '/v1/class/cancelMuteChatroom',
  muteUser = '/v1/class/muteUser',
  cancelMuteUser = '/v1/class/cancelMuteUser',
  joinClass = '/v1/class/joinClass',
  leaveClass = '/v1/class/leaveClass',
  kickClass = '/v1/class/kickClass',
  listMembers = '/v1/class/listMembers',
  getAssistantPermit = '/v1/class/getAssistantPermit',
  setAssistantPermit = '/v1/class/setAssistantPermit',
  deleteAssistantPermit = '/v1/class/deleteAssistantPermit',
  setCheckIn = '/class/setCheckIn',
  getRunningCheckIn = '/class/getRunningCheckIn',
  getAllCheckIns = '/class/getAllCheckIns',
  checkIn = '/class/checkIn',
  getCheckInRecords = '/class/getCheckInRecords',
  getCheckInRecordByUserId = '/class/getCheckInRecordByUserId',
}

export function getApiUrl(name: ApiNames) {
  return `${RequestBaseUrl}${name}`;
}
