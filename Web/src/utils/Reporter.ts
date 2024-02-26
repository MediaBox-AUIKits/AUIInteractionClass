import SlsTracker from '@aliyun-sls/web-track-browser';
import { SystemUtil, BrowserUtil, Guid } from 'useragent-utils';
import { getEnumKey } from './common';

export enum EMsgid {
  LOGIN = 100,
  LOGIN_RESULT = 101,
  ENTER_CLASSROOM = 200,
  ENTER_CLASSROOM_RESULT = 201,
  CREATE_CLASSROOM = 300,
  CREATE_CLASSROOM_RESULT = 301,
  CLASSROOM_PARAMS_ILLEGAL = 400,
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
  appid: string;
  /**
   * 当前页面 title
   */
  appname: string;
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
  stm?: number;
  /**
   * useragent
   */
  ua: string;

  /**
   * 用户id
   */
  userid?: string;
  username?: string;
  role?: number;

  /**
   * 教室id、名称
   */
  classid?: string;
  classname?: string;

  /**
   * 事件
   */
  event_id?: EMsgid;
  event_name?: string;

  /**
   * event_id 对应的参数
   */
  args?: Record<string, any>;

  /**
   * event_id 对应的结果
   */
  rslt?: number;
  err?: Error | string | unknown;
}

export class Reporter {
  private _commonParams: ICommonParams;
  private _track?: SlsTracker;
  private _eventEnumObject?: object;

  constructor() {
    this._commonParams = this.initCommonParams();
    if (CONFIG?.reporter?.enable) {
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
      appid: window?.location?.host ?? '',
      appname: window?.document.title ?? '',
      tid: Guid.create(32),
      uuid: this.getUuid(),
      ua: (navigator && navigator.userAgent) || '',
    };
  }

  private initTracker() {
    const opts = {
      host: CONFIG?.reporter?.host, // 所在地域的服务入口
      project: CONFIG?.reporter?.projectName, // Project名称。
      logstore: CONFIG?.reporter?.logstore, // Logstore名称。
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
      ? window.btoa(CONFIG?.reporter?.projectName)
      : `__${CONFIG?.reporter?.projectName}__UUID__`;

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

  public updateEventEnum(enumObject: object) {
    this._eventEnumObject = enumObject;
  }

  public report(
    params: Pick<ICommonParams, 'args' | 'event_id' | 'rslt' | 'err'>
  ) {
    const { event_id } = params;
    const event_name = event_id
      ? getEnumKey(this._eventEnumObject ?? EMsgid, event_id) ??
        getEnumKey(EMsgid, event_id) ??
        undefined
      : undefined;
    const reportData = {
      ...this._commonParams,
      ...params,
      event_name,
      stm: Date.now(),
    };
    // TODO: DEL
    // console.log(`#发送日志 ${event_id} | ${event_name}`, reportData);
    this._track?.send(reportData);
  }

  // 上报应用运行过程中采集的信息（比如环境信息、设备授权情况等）或者异常状态
  public reportInfo(eventId: number, args: any = '') {
    this.report({
      event_id: eventId,
      args,
    });
  }

  // 上报行为触发
  public reportInvoke(eventId: number, args: any = '') {
    this.report({
      event_id: eventId,
      args,
    });
  }

  // 上报行为触发结果
  public reportInvokeResult(
    eventId: number,
    success: boolean,
    args: any = '',
    error?: Error | AggregateError | unknown
  ) {
    let err = error;
    if (error instanceof AggregateError) {
      err = error.errors
        .map(errItem =>
          errItem instanceof Error
            ? errItem.message ?? errItem
            : JSON.stringify(errItem)
        )
        .join('; ');
    }
    this.report({
      event_id: eventId,
      rslt: success ? 0 : 1,
      err: err ?? '',
      args,
    });
  }

  public classroomParamsIllegal(args?: any) {
    this.report({
      event_id: EMsgid.CLASSROOM_PARAMS_ILLEGAL,
      args,
    });
  }
}

const reporter = new Reporter();
export default reporter;
