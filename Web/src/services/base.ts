// 配置 APPServer 服务域名
export const ServicesOrigin = CONFIG.appServer.origin;

// 配置api接口路径前缀
export const ApiPrefixPath = CONFIG.appServer.apiPrefixPath;

export const RequestBaseUrl = `${ServicesOrigin}${ApiPrefixPath}`;

// api名
export enum ApiNames {
  login = 'login',
  token = 'token',
  create = 'create',
  list = 'list',
  get = 'get',
  start = 'start',
  stop = 'stop',
  getMeetingInfo = 'getMeetingInfo',
  updateMeetingInfo = 'updateMeetingInfo',
  wbAuth = 'getWhiteboardAuthInfo',
  queryDoc = 'queryDoc',
  deleteDocs = 'deleteDocs',
  addDocs = 'addDocs',
  isMuteChatroom = 'isMuteChatroom',
  muteChatroom = 'muteChatroom',
  cancelMuteChatroom = 'cancelMuteChatroom',
  muteUser = 'muteUser',
  cancelMuteUser = 'cancelMuteUser',
  joinClass = 'joinClass',
  leaveClass = 'leaveClass',
  kickClass = 'kickClass',
  listMembers = 'listMembers',
};

export function getApiUrl(name: ApiNames) {
  return `${RequestBaseUrl}${name}`;
}
