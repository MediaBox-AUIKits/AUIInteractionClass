import axios from 'axios';
import { serialize, parse } from 'cookie-es';
import { v4 as uuidv4 } from 'uuid';
import { ApiNames, RequestBaseUrl } from './base';
import { convertToCamel } from '@/utils/common';
import { IClassroomInfo } from '@/types';

// 用于本地测试储存用户信息的 cookie key，可以换成您实际自己的 key
const AuiUserNameCookieKey = 'aui_classroom_usernick';
const AuiUserIdCookieKey = 'aui_classroom_userid';
const AuiUserToken = 'aui_classroom_token';
const AuiClassroomUuid = 'aui_classroom_uuid';

class Services {
  private authToken: string = '';
  private userId: string = '';
  private userName: string = '';
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
    this.request.interceptors.response.use((res) => {
      if (res.status === 200) {
        if (!res.data) {
          return this.handleError({
            code: -1,
            message: 'Data Exception',
          });
        }
        if (!res.data.success) {
          return this.handleError({
            code: res.data.errorCode || -2,
            message: res.data.errorMsg || 'The error message is empty',
          });
        }
        return res.data.data;
      }
      return this.handleError(res);
    }, (error) => {
      return this.handleError(error);
    });
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
    };
  }

  // demo 测试检测是否登录逻辑，正式使用时需要您自行实现真正的判断逻辑
  public checkLogin() {
    return new Promise((resolve, reject) => {
      const cookieObj: any = parse(document.cookie);
      if (cookieObj[AuiUserNameCookieKey] && cookieObj[AuiUserIdCookieKey] && cookieObj[AuiUserToken]) {
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
      const res: any = await this.request.post(ApiNames.login, {
        username,
        password: username, // 示例逻辑，目前 Appserver 层判断 username 得相等 password，实际开发请勿使用明文密码的方式登录
      }, {
        headers: {},
      });
      const { token, expire } = res;
      if (token && expire) {
        this.authToken = token;
        this.userName = username;
        this.userId = userId;

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
    let expireDate = expireStr ? new Date(expireStr) : new Date(Date.now() + 1000 * 60 * 60);

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
  public async getToken(userId?: string) {
    let device_id = localStorage.getItem(AuiClassroomUuid) || uuidv4();
    localStorage.setItem(AuiClassroomUuid, device_id);

    try {
      const res = await this.request.post(
        ApiNames.token,
        {
          user_id: userId || this.userId,
          device_type: 'web',
          device_id,
        },
      );
      return res;
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

  // 获取房间详情
  public async getRoomDetail(roomId: string): Promise<IClassroomInfo> {
    try {
      const res = await this.request.post(ApiNames.get, {
        user_id: this.userId,
        id: roomId,
      });
      const detail: any = convertToCamel(res);
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
}

export default new Services();
