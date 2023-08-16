import SlsTracker from '@aliyun-sls/web-track-browser';
import { SystemUtil, BrowserUtil, Guid } from 'useragent-utils';

enum EMsgid {
  CREATE_CLASSROOM = 100,
  CREATE_OR_ENTER_CLASSROOM_ERROR = 101,
  CLASSROOM_PARAMS_ILLEGAL = 102,
}

interface ICommonParams {
  /**
   * 点位版本
   * reporter version
   */
  rv: string;
  /**
   * 前端代码版本
   * front version
   */
  av: string;
  /**
   * 业务类型
   */
  biz?: number;
  /**
   * 系统类型
   */
  os: string;
  /**
   * 系统版本
   */
  ov: string;
  /**
   * 浏览器类型
   */
  bt: string;
  /**
   * 浏览器版本
   */
  bv: string;
  /**
   * 当前页面 host
   */
  host: string;
  /**
   * 当前页面地址 page url
   */
  pu: string;
  /**
   * 页面不刷新就不会变
   */
  tid: string;
  /**
   * uuid
   */
  uuid: string;
  /**
   * 采集时间
   */
  ct?: number;
  /**
   * useragent
   */
  ua: string;

  /**
   * 用户id
   */
  userid?: string;
  username?: string;

  /**
   * 教室id、名称
   */
  classid?: string;
  classname?: string;

  /**
   * 事件id
   */
  msgid?: EMsgid;

  /**
   * msgid 对应的参数
   */
  args?: Record<string, any>;
}

export class Reporter {
  private _commonParams: ICommonParams;
  private _track?: SlsTracker;

  constructor() {
    this._commonParams = this.initCommonParams();
    if (CONFIG && CONFIG.reporter && CONFIG.reporter.enable) {
      this._track = this.initTracker();
    }
  }

  private initCommonParams(): ICommonParams {
    return {
      rv: '1.0.0',
      av: ASSETS_VERSION || '',
      os: SystemUtil.platform,
      ov: SystemUtil.systemVersion,
      bt: BrowserUtil.browserName,
      bv: BrowserUtil.browserVersion,
      host: window.location.origin,
      pu: window.location.href,
      tid: Guid.create(32),
      uuid: this.getUuid(),
      ua: (navigator && navigator.userAgent) || '',
    };
  }

  private initTracker() {
    const opts = {
      host: CONFIG.reporter.host, // 所在地域的服务入口
      project: CONFIG.reporter.projectName, // Project名称。
      logstore: CONFIG.reporter.logstore, // Logstore名称。
      time: 5, // 发送日志的时间间隔，默认是10秒。
      count: 10, // 发送日志的数量大小，默认是10条。
      topic: 'topic', // 自定义日志主题。
      source: 'source',
      tags: {
        tags: 'tags',
      },
    };
    return new SlsTracker(opts);
  }

  private getUuid() {
    const STORE_KEY = window.btoa
      ? window.btoa(CONFIG.reporter.projectName)
      : `__${CONFIG.reporter.projectName}__UUID__`;

    const uuid = localStorage.getItem(STORE_KEY) || Guid.create(32);
    localStorage.setItem(STORE_KEY, uuid);
    return uuid;
  }

  /**
   * 更新公共点位
   */
  public updateCommonParams(params: Partial<ICommonParams> = {}) {
    this._commonParams = {
      ...this._commonParams,
      ...params,
    };
  }

  public report(params: Pick<ICommonParams, 'args' | 'msgid'>) {
    if (this._track) {
      const reportData = {
        ...this._commonParams,
        ...params,
        ct: Date.now(),
      };
      this._track.send(reportData);
    }
  }

  public createClassroom() {
    this.report({
      msgid: EMsgid.CREATE_CLASSROOM,
    });
  }

  public createOrEnterClassroomError(args: any) {
    this.report({
      msgid: EMsgid.CREATE_OR_ENTER_CLASSROOM_ERROR,
      args,
    });
  }

  public classroomParamsIllegal(args: any) {
    this.report({
      msgid: EMsgid.CLASSROOM_PARAMS_ILLEGAL,
      args,
    });
  }
}

const reporter = new Reporter();
export default reporter;
