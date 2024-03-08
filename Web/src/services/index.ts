import axios from 'axios';
import { serialize, parse } from 'cookie-es';
import { v4 as uuidv4 } from 'uuid';
import { ApiNames, RequestBaseUrl, getApiUrl } from './base';
import {
  convertToCamel,
  convertToUnderline,
  getRandomAvatar,
} from '@/utils/common';
import {
  IClassroomInfo,
  ISpectatorInfo,
  MeetingInfo,
  Permission,
} from '@/types';

async function postUseFerch(url: string, authToken: string, data: any = {}) {
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    keepalive: true,
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

// 用于本地测试储存用户信息的 cookie key，可以换成您实际自己的 key
const AuiUserNameCookieKey = 'aui_classroom_usernick';
const AuiUserIdCookieKey = 'aui_classroom_userid';
const AuiUserToken = 'aui_classroom_token';
const AuiClassroomUuid = 'aui_classroom_uuid';

class Services {
  private authToken: string = '';
  private userId: string = '';
  private userName: string = '';
  private userAvatar: string = ''; // 体验头像
  // 创建 axios 实例
  private request = axios.create({
    baseURL: RequestBaseUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // 统一处理接口返回
    this.request.interceptors.response.use(
      res => {
        if (res.status === 200) {
          if (!res.data) {
            return this.handleError({
              code: -1,
              message: 'Data Exception',
              extra: {
                url: res.config.url,
              },
            });
          }
          if (!res.data.success) {
            let message = res.data.errorMsg || 'The error message is empty';
            if (res.data.data?.reason) {
              // 部分接口错误信息放在这
              message = res.data.data.reason;
            }
            return this.handleError({
              code: res.data.errorCode ?? -2,
              message,
              extra: {
                ...(res.data.data ?? {}),
                url: res.config.url,
                params: res.config.data,
              },
            });
          }
          return res.data.data;
        }
        return this.handleError(res);
      },
      error => {
        return this.handleError(error);
      }
    );
  }

  // 在这个函数中处理特殊，比如 token 失效时主动 refresh、登录失效时提示用户
  private handleError(error: any) {
    if (!error.response) {
      return Promise.reject(error);
    }
    // 特殊异常处理，若 401 是登录失效，可以在这里做弹窗提示等操作
    // if (error.response.status === 401) {}
    return Promise.reject(error);
  }

  public getUserInfo() {
    return {
      userId: this.userId,
      userName: this.userName,
      userAvatar: this.userAvatar,
    };
  }

  // demo 测试检测是否登录逻辑，正式使用时需要您自行实现真正的判断逻辑
  public checkLogin() {
    return new Promise((resolve, reject) => {
      const cookieObj: any = parse(document.cookie);
      if (
        cookieObj[AuiUserNameCookieKey] &&
        cookieObj[AuiUserIdCookieKey] &&
        cookieObj[AuiUserToken]
      ) {
        // 若 cookie 中有用户相关信息，则判断是已登录
        this.authToken = cookieObj[AuiUserToken];
        this.userId = cookieObj[AuiUserIdCookieKey];
        this.userName = cookieObj[AuiUserNameCookieKey];

        this.setHeaderAuthorization();

        resolve({
          userName: cookieObj[AuiUserNameCookieKey],
          userId: cookieObj[AuiUserIdCookieKey],
          token: cookieObj[AuiUserToken],
        });
        return;
      }
      reject();
    });
  }

  // 此处登录逻辑为示例逻辑，实际开发请接入 SSO 单点登录、OAuth2 等方案，请勿使用明文密码
  public async login(userId: string, username: string) {
    try {
      const res: any = await this.request.post(
        ApiNames.login,
        {
          username,
          password: username, // 示例逻辑，目前 Appserver 层判断 username 得相等 password，实际开发请勿使用明文密码的方式登录
        },
        {
          headers: {},
        }
      );
      const { token, expire } = res;
      if (token && expire) {
        this.authToken = token;
        this.userName = username;
        this.userId = userId;
        this.userAvatar = getRandomAvatar(userId); // 随机取头像，用于体验demo，实际开发请使用真实数据

        this.setLoginCookie(expire);
        this.setHeaderAuthorization();

        return res;
      }
      throw res;
    } catch (error) {
      throw error;
    }
  }

  private setLoginCookie(expireStr?: string) {
    // 若没有，则一小时后过期
    let expireDate = expireStr
      ? new Date(expireStr)
      : new Date(Date.now() + 1000 * 60 * 60);

    function setCookie(key: string, value: string) {
      const cookieStr = serialize(key, value, { expires: expireDate });
      document.cookie = cookieStr;
    }

    setCookie(AuiUserIdCookieKey, this.userId);
    setCookie(AuiUserNameCookieKey, this.userName);
    setCookie(AuiUserToken, this.authToken);
  }

  // 将登录 token 设置为请求 header 的 Authorization，Appserver 要求加上 Bearer 前缀
  private setHeaderAuthorization() {
    this.request.defaults.headers.common.Authorization = `Bearer ${this.authToken}`;
  }

  // 这里的 token 是 Interaction SDK 所需要使用的，不是接口所使用的登录 token
  public async getToken(im_server?: string[], role?: string, userId?: string) {
    let device_id = localStorage.getItem(AuiClassroomUuid) || uuidv4();
    localStorage.setItem(AuiClassroomUuid, device_id);

    try {
      const res = await this.request.post(ApiNames.token, {
        user_id: userId || this.userId,
        device_type: 'web',
        device_id,
        im_server,
        role,
      });
      return {
        aliyunIMV2: convertToCamel(res).aliyunNewIm,
        aliyunIMV1: convertToCamel(res).aliyunOldIm,
        rongCloud: convertToCamel(res).rongCloud,
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取房间列表
  public async getRoomList(pageNum: number, pageSize: number) {
    try {
      const res = await this.request.post(ApiNames.list, {
        user_id: this.userId,
        page_num: pageNum,
        page_size: pageSize,
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  // 获取课堂详情
  public async getRoomDetail(classId: string): Promise<IClassroomInfo> {
    try {
      const res = await this.request.post(ApiNames.get, {
        user_id: this.userId,
        id: classId,
      });
      const detail: any = convertToCamel(res);
      detail.assistantId = detail.assistantPermit?.userId;
      return detail;
    } catch (error) {
      throw error;
    }
  }

  // 创建教室
  public async createRoom(data: any): Promise<IClassroomInfo> {
    try {
      const res = await this.request.post(ApiNames.create, data);
      const detail: any = convertToCamel(res);
      return detail;
    } catch (error) {
      throw error;
    }
  }

  // 获取当前教室助教权限
  public async getAssistantPermissions(
    classId: string
  ): Promise<Permission[] | undefined> {
    try {
      const res: any = await this.request.post(ApiNames.getAssistantPermit, {
        class_id: classId,
      });
      return res?.permit ? JSON.parse(res.permit) : undefined;
    } catch (error) {
      throw error;
    }
  }

  // 设置当前教室助教权限
  public async setAssistantPermissions(
    classId: string,
    config: string
  ): Promise<void> {
    try {
      await this.request.post(ApiNames.setAssistantPermit, {
        class_id: classId,
        permit: config,
      });
    } catch (error) {
      throw error;
    }
  }

  // 删除当前教室助教设置
  public async deleteAssistantPermissions(classId: string): Promise<void> {
    try {
      const { aliyunIMV2 } = CONFIG.imServer ?? {};
      await this.request.post(ApiNames.deleteAssistantPermit, {
        class_id: classId,
        im_server:
          aliyunIMV2?.primary && aliyunIMV2?.enable
            ? ['aliyun_new']
            : ['aliyun_old'],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 开始上课
   */
  public async startClass(classId: string) {
    try {
      const res = await this.request.post(ApiNames.start, {
        user_id: this.userId,
        id: classId,
      });
      const detail: any = convertToCamel(res);
      return detail;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 下课
   */
  public async stopClass(classId: string) {
    try {
      const res = await this.request.post(ApiNames.stop, {
        user_id: this.userId,
        id: classId,
      });
      const detail: any = convertToCamel(res);
      return detail;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取连麦用户信息
   * @param {string} classId 课堂id
   */
  public async getMeetingInfo(classId: string): Promise<MeetingInfo> {
    try {
      const res = await this.request.post(ApiNames.getMeetingInfo, {
        id: classId,
      });
      const detail: any = convertToCamel(res);
      return detail || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新连麦用户信息
   * @param {string} classId 直播间id
   * @param {ISpectatorInfo[]} members 连麦用户信息数组
   */
  public async updateMeetingInfo(
    classId: string,
    payload: Partial<MeetingInfo>
  ) {
    try {
      const res = await this.request.post(ApiNames.updateMeetingInfo, {
        id: classId,
        ...convertToUnderline(payload),
      });
      return res;
    } catch (error) {
      throw error;
    }
  }

  // 白板身份登录数据接口
  public getWhiteboardAuthInfo(): Promise<{
    nonce: string;
    checksum: string;
    curTime: number;
  }> {
    return this.request.post(ApiNames.wbAuth);
  }

  // 添加白板文件
  public addDocs(data: any) {
    return this.request.post(ApiNames.addDocs, data);
  }

  // 删除白板文件
  public deleteDocs(data: any) {
    return this.request.post(ApiNames.deleteDocs, data);
  }

  // 查询白板文件
  public queryDoc(id: string) {
    return this.request.post(ApiNames.queryDoc, {
      classId: id,
    });
  }

  // 用于融云方案时查询聊天室是否禁言
  public isMuteChatroom(chatroomId: string, serverType: string): Promise<any> {
    return this.request.post(ApiNames.isMuteChatroom, {
      chatroom_id: chatroomId,
      server_type: serverType,
    });
  }

  public muteChatroom(chatroomId: string, serverType: string): Promise<any> {
    return this.request.post(ApiNames.muteChatroom, {
      chatroom_id: chatroomId,
      server_type: serverType,
    });
  }

  public cancelMuteChatroom(
    chatroomId: string,
    serverType: string
  ): Promise<any> {
    return this.request.post(ApiNames.cancelMuteChatroom, {
      chatroom_id: chatroomId,
      server_type: serverType,
    });
  }

  public muteUser(
    chatroomId: string,
    userId: string,
    minute: number,
    serverType: string
  ): Promise<any> {
    return this.request.post(ApiNames.muteUser, {
      chatroom_id: chatroomId,
      server_type: serverType,
      user_id: userId,
      minute,
    });
  }

  public cancelMuteUser(
    chatroomId: string,
    userId: string,
    serverType: string
  ): Promise<any> {
    return this.request.post(ApiNames.cancelMuteUser, {
      chatroom_id: chatroomId,
      server_type: serverType,
      user_id: userId,
    });
  }

  public joinClass(class_id: string, identity?: number) {
    return this.request.post(ApiNames.joinClass, {
      class_id,
      user_id: this.userId,
      user_name: this.userName,
      user_avatar: getRandomAvatar(this.userId),
      identity,
    });
  }

  public leaveClass(class_id: string) {
    // 因为 fetch 开启 keepalive 时即便页面刷新、关闭也可以成功发送数据，所以离开的接口优先使用 fetch
    if (typeof fetch === 'function') {
      return postUseFerch(getApiUrl(ApiNames.leaveClass), this.authToken, {
        class_id,
        user_id: this.userId,
      });
    }
    return this.request.post(ApiNames.leaveClass, {
      class_id,
      user_id: this.userId,
    });
  }

  public kickClass(class_id: string, user_id: string) {
    const { aliyunIMV2 } = CONFIG.imServer ?? {};
    return this.request.post(ApiNames.kickClass, {
      class_id,
      user_id,
      im_server:
        aliyunIMV2?.primary && aliyunIMV2?.enable
          ? ['aliyun_new']
          : ['aliyun_old'],
    });
  }

  /**
   * 成员列表
   *
   * @param {{
   *     class_id: string;
   *     identity: number;
   *     status: number;
   *     page_num?: number;
   *     page_size?: number;
   *   }} options
   * @return {*}
   * @memberof Services
   */
  public async listMembers(options: {
    class_id: string;
    identity: number;
    status: number;
    page_num?: number;
    page_size?: number;
  }) {
    try {
      const res = await this.request.post(ApiNames.listMembers, options);
      const detail: any = convertToCamel(res);
      return detail;
    } catch (error) {
      throw error;
    }
  }

  // 设置签到
  public async setCheckIn(params: {
    class_id: string;
    user_id: string;
    duration: number;
  }) {
    try {
      const res = await this.request.post(ApiNames.setCheckIn, params);
      return convertToCamel(res);
    } catch (error) {
      throw error;
    }
  }

  // 查询正在运行的签到
  public async getRunningCheckIn(class_id: string) {
    try {
      const res = await this.request.post(ApiNames.getRunningCheckIn, {
        class_id,
      });
      return convertToCamel(res);
    } catch (error) {
      throw error;
    }
  }

  // 查询所有设置过的签到
  public async getAllCheckIns(class_id: string) {
    try {
      const res = await this.request.post(ApiNames.getAllCheckIns, {
        class_id,
      });
      return convertToCamel(res);
    } catch (error) {
      throw error;
    }
  }

  // 学生签到
  public async checkIn(check_in_id: string, user_id: string) {
    try {
      await this.request.post(ApiNames.checkIn, {
        check_in_id,
        user_id,
      });
    } catch (error) {
      throw error;
    }
  }

  // 查询某个签到的历史记录
  public async getCheckInRecords(check_in_id: string) {
    try {
      const res = await this.request.post(ApiNames.getCheckInRecords, {
        check_in_id,
      });
      return convertToCamel(res);
    } catch (error) {
      throw error;
    }
  }

  // 查询某个学生是否已签到
  public async getCheckInRecordByUserId(check_in_id: string, user_id: string) {
    try {
      const res = await this.request.post(ApiNames.getCheckInRecordByUserId, {
        check_in_id,
        user_id,
      });
      return convertToCamel(res);
    } catch (error) {
      throw error;
    }
  }
}

export default new Services();
