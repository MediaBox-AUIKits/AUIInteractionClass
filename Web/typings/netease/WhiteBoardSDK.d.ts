import { DrawPlugin } from "./DrawPlugin";
import { IG1WhiteBoardOption, IG2WhiteBoardOption, IJoinRoomCallback, IShowToastOption } from "./types";

/**
 * 房间工具栏接口
 */
declare namespace WhiteBoardSDK {
    /**
     * G1互动白板getInstance
     * @example
     * ```
     * //html
     * //<script src='url/WhiteBoardSDK_IM_v{x.y.z}.js'></script>
     * 
     * const whiteboardSDK = WhiteBoardSDK.getInstance({
     *  appKey: 'xxxx',
     *  account: 'im account',
     *  token: 'im token',
     *  nickname: 'xxx',
     *  debug: true,
     *  record: true,
     *  container: document.getElementById('whiteboard'),
     *  platform: 'web',
     *  getAuthInfo: () => {
     *      return axios.getAuth('server_request_url')
     *          .then(function(response) {
     *              return {
     *                  checksum: response.data.checksum,
     *                  nonce: response.data.nonce,
     *                  curTime: response.data.curTime
     *              }
     *          })
     *  }
     * })
     * ```
     */
    function getInstance(option: IG1WhiteBoardOption): WhiteBoardSDKInstance;
    /**
     * G2互动白板getInstance
     * @example
     * ```
     * //html
     * //<script src='url/WhiteBoardSDK_v{x.y.z}.js'></script>
     * 
     * const whiteboardSDK = WhiteBoardSDK.getInstance({
     *  appKey: 'xxxx',
     *  //与用户的账号体系对应的用户标志id。 同一个uid不允许多处同时登陆白板
     *  uid: 123123,
     *  nickname: 'xxx',
     *  debug: true,
     *  record: true,
     *  container: document.getElementById('whiteboard'),
     *  platform: 'web',
     *  getAuthInfo: () => {
     *      return axios.getAuth('server_request_url')
     *          .then(function(response) {
     *              return {
     *                  checksum: response.data.checksum,
     *                  nonce: response.data.nonce,
     *                  curTime: response.data.curTime
     *              }
     *          })
     *  }
     * })
     * ```
     */
     function getInstance(option: IG2WhiteBoardOption): WhiteBoardSDKInstance;

     /**
      * 显示Toast。如果调用此函数时，另一个Toast正在显示，则正在显示的Toast会被移除
      * @example
      */
    function showToast(option: IShowToastOption): void;

     /**
      * 移除正在显示的Toast
      * 
      */
    function  hideToast(): void

    /**
     * 监听showToast请求，并可以修改showToast的参数。
     * 若返回为true，则继续按照之前的参数显示Toast，若返回为false，则不显示Toast
     * 
     * 若返回为{@link IShowToastOption}，则按照返回的参数显示。开发者可以修改Toast的类型，
     * 位置，信息，以及时间。
     * @param option 
     * 
     * @example
     * 每个消息的长度都增加3s
     * ```
     * WhiteBoardSDK.interceptShowToast((option) => {
     *    option.time = option.time + 3
     *    return option
     * })
     * ```
     * 
     * @example
     * 修改消息的文本
     * ```
     * WhiteBoardSDK.interceptShowToast((option) => {
     *    if (option.msgType === 'NOT_ALLOWED_REPLACE_ACTIVE_BROADCASTER') {
     *       option.msg = `当前会议参会者${option.args.broadcasterName}正在共享视角`
     *       return option
     *    } else {
     *       return true
     *    }
     * })
     * ```
     * 
     * @example
     *
     * 客户端若需要定制Toast，可以先将拦截函数转化为string，然后作为参数传入
     * 
     * ```
     * const funcStr = ((option) => {
     *    option.time = option.time + 3
     *    return option
     * }).toString()
     * 
     * WhiteBoardSDK.interceptShowToast(funcStr)
     * ```
     * 
     * {
     *  action: 'jsDirectCall',
     *      param: {
     *          target: 'WhiteBoardSDKClass',
     *          funcName: 'interceptShowToast',
     *          arg1: ((option) => {
     *              option.time = option.time + 3
     *              return option
     *          }).toString()
     *      }
     * }
     */
     function interceptShowToast(fn: string | ((option: IShowToastOption) => IShowToastOption | boolean)): void

     /**
      * 移除之前设置的Toast拦截函数
      */
     function removeToastIntercept(): void
}


export interface WhiteBoardSDKInstance {
    /**
     * 加入白板房间。进入成功后
     * 
     * opt.createRoom建议一直设置为true。G1登录时重复创建房间会报错，但是不影响运行。G2该参数没有被用到。
     * 
     * @example
     * ```
     *  whiteboardSdk
     *      .joinRoom(
     *      {
     *          channel: '871239'       //房间名字
     *      },
     *      {
     *          ondisconnected: (err) => {}
     *          onwillreconnect: () => {}
     *          onconnected: () => {},
     *          onSyncStart: () => {},
     *          onSyncFinish: () => {}
     *      }
     *  )
     *  .then(drawPlugin => {
     *      //加入房间成功。
     *      drawPlugin.enableDraw(true)
     *      toolCollection = ToolCollection.getInstance({
     *          container: document.getElementById('whiteboard'),
     *          handler: drawPlugin,
     *          options: {
     *              platform: 'web'
     *          }
     *      })
     *      toolCollection.show()
     *  })
     *  .catch(err => {
     *      //加入房间失败
     *  })
     * ```
     */
    joinRoom(opt: {
        /**
         * 房间名称
         */
        channel: string
        /**
         * 默认为false。
         * 是否创建持久化房间。多个用户joinRoom进入同一个channel时，会以第一个用户的持久化参数作为标准
         * 
         * 注意，仅G2白板支持创建持久化房间
         */
        persistent?: boolean
        /**
         * 持久化房间销毁时间；Unix时间戳；精确到s。最长为30个自然日。
         */
        channelDestroyTime?: number
    }, callback: IJoinRoomCallback): Promise<DrawPlugin>

    /**
     * 断开连接。销毁sdk
     * 
     * 房间的销毁需要满足下面条件：
     * 房间内每个用户都处于下面这两个状态之一：
     * 1. 调用了destroy
     * 2. 心跳超时超过一分钟
     * 
     * 如果用户A调用了destroy后，假若房间内有其他用户导致房间未销毁，用户A仍可以重新创建whiteboardSDK，并通过joinRoom重新进入房间 
     */
    destroy(): void

    /**
     * 返回当前用户的uid。G2白板既返回用户传入的uid。G1白板会返回im账号在云信内部映射的uid。录像回放可能需要该uid获取录像文件
     */
    getUid(): number

    /**
     * 返回当前房间的cid。可用于获取录像文件。
     * 
     * 注意joinRoom时，若当前该channel的房间不存在，则会创建一个新的cid对应当前的房间。房间销毁后，该cid对应的房间周期就结束了。之后用同样的channel创建房间时，会生成新的cid。
     * 
     * 每次白板房间的cid不会重复。
     */
    getChannelId(): string

    /**
     * 返回白板是否处于连接状态。只有不处于同步状态，且处于连接状态时，才能够修改白板的状态。
     * 若需要监听白板连接状态, 或者同步状态的变化，可以通过 {@link IJoinRoomCallback}
     */
    isConnected(): boolean

    /**
     * 返回白板是否处于同步中。只有不处于同步状态，且处于连接状态时，才能够修改白板的状态。
     * 若需要监听白板连接状态, 或者同步状态的变化，可以通过 {@link IJoinRoomCallback}
     */
    isSynchronizing(): boolean
}

export default WhiteBoardSDK