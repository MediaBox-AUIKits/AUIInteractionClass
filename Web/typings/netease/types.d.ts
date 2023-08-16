import { DrawPlugin } from "./DrawPlugin";

export interface IStyle {
    /**
     * 涂鸦和直线样式
     */
    pen: {
        lineWidth: number;
        stroke: string;
    }
    /**
     * 连接样式
     */
    link: {
        linkType: 0 | 1 | 2;
        text: {
            stroke: string;
            fontSize: number;
            fontFamily: string;
        };
        stroke: string;
        lineWidth: number;
        startArrow: 0 | 1;
        endArrow: 0 | 1;
    },
    /**
     * 图形样式
     */
    shape: {
        lineWidth: number;
        stroke: string | undefined;
        fill: string | undefined;
        text: {
            fontSize: number;
            fontFamily: string;
            stroke: string;
            fill: string | undefined;
            textAlign: "left" | "center" | "right";
            verticalAlign: "top" | 'middle' | "bottom";
        }
    }
    /**
     * 文本样式
     */
    text: {
        fontSize: number;
        fontFamily: string;
        stroke: string;
        fill: string | undefined;
        textAlign: "left" | "center" | "right";
    }
}

export type IFont = {
    displayName: string
    fontName: string
} | {
    displayName: string
    fontFace: IFontFace
}

type IFontFace = Array<{
    url: string,
    format?: string
}> | {
    url: string,
    format?: string
}

/**
 * 工具栏的位置
 */
export type IPosition = 'leftBottom' | 'left' | 'leftTop' | 'topLeft' | 'top' | 'topRight' | 'rightTop' | 'right' | 'rightBottom' | 'bottomRight' | 'bottom' | 'bottomLeft'

/**
 * sdk运行的目标设置
 */
export type IPlatform = 'web' | 'ios' | 'android' | 'pc' | 'mac' | 'pad'

/**
 * 工具栏工具类型。除了下面列出的类型外，还可以设置自定义工具栏按钮：
 * 
 * custom-xxx: xxx是任意字符串。表示自定义组件。
 * 
 * custom-state-yyy: yyy是任意字符串。表示自定义状态组件 {@Link ICustomStateUnitOption}
 * 
 * custom-popup-zzz: zzz是任意字符串。表示自定义弹窗组件 {@Link ICustomPopUnitOption}
 */
export type ITool = 'select'| 'laser'| 'pen' | 'text'| 'element-eraser'| 'duplicate'
    | 'clear'| 'undo'| 'redo'| 'pan'| 'image' | 'zoomIn' | 'zoomOut' | 'reset' | 'fitToContentDoc' | 'zoomLevel' | 'firstPage' | 'lastPage' | 'prevPage' | 'nextPage' | 'pageInfo'
    | 'preview' | 'docUpload' | 'docSelect' | 'pageBoardInfo' | 'fitToContent' | 'fitToDoc' | 'shapeSelect'

/**
 * 各类图标的私有配置
 */
export type IToolCustomProperty = (ICustomStateUnitOption | ICustomPopUnitOption | IPreviewUnitOption | 
    IMultiInOneOption | IDocUploadOption | IShapeSelectOption)

/**
 * ToolCollection.getInstance的参数
 */
export interface IToolCollectionOption {
    /**
     * 工具栏容器。一般和白板共享一个容器
     */
    container: HTMLDivElement
    /**
     * 加入房间后返回的drawPlugin对象
     */
    handler: DrawPlugin
    /**
     * 设备类型。会影响默认工具栏布局，以及默认工具栏包含哪些元素
     */
    platform: IPlatform
    /**
     * 工具栏图标默认大小。默认为32px
     * 
     * @defaultValue '32'
     */
    itemDefaultSize?: number
    /**
     * containerOptions
     */
    containerOptions?: Array<IContainerOption>
}

/**
 * ToolCollection.getInstance，以及tcInstance.setContainerOptions
 */
export interface IContainerOption {
    /**
     * 该工具栏条的目标位置
     */
    position: IPosition,
    /**
     * 该工具栏条包含的按钮配置
     */
    items: Array<IUnitOption>,
    /**
     * 工具栏container离左侧容器的距离
     * @defaultValue 16
     */
    marginLeft?: number,
    /**
    * 工具栏container离右侧容器的距离
    * @defaultValue '16'
    */
    marginRight?: number,
    /**
  * 工具栏container离上侧容器的距离
  * @defaultValue '16'
  */
    marginTop?: number,
    /**
    * 工具栏container离下侧容器的距离
    * @defaultValue '16'
    */
    marginBottom?: number,
    /**
     * 是否显示工具栏container
     * 
     * @defaultValue true
     */
    hidden?: boolean
}

/**
 * @example
 * 示例为收纳盒的配置
 * 
 * ```
 * {
 *      tool: 'undo',
 *      hint: '撤销'
 * }
 * ```
 */
export type IUnitOption = {
    /**
     * string类型为自定义按钮: 'custom-xxx', 'custom-state-xxx', 'custom-popup-xxx'
     */
    tool: ITool | string,
    /**
     * size默认为1
     * size表示元素占据几个位置
     * 常规元素占据一格位置。翻页工具会占据约5-6格位置
     */
    size?: number
    /**
     * 工具的背景图。
     */
    backgroundImage?: string
    /**
     * 鼠标悬浮在图标之上时的
     */
    hint?: string
    /**
     * 如果需要在一个container中添加同名的工具，可以设置不同的id
     * 默认id为工具的tool名
     */
    id?: string
} & IToolCustomProperty

export interface IDocEntity {
    /**
     * 文档的唯一id
     */
    docId: string,                  
    /**
     * 文档类型，会影响弹窗中文档的图标
     */  
    fileType: 'pdf' | 'ppt' | 'doc',
    /**
     * 文档名称，会影响弹窗中文档名称
     */
    name: string,                    
    /**
     * 是否在文档弹窗中显示删除按钮
     */
    showDelete?: boolean,      
    /**
     * 文档具体的数据参数
     */
    params: IStaticDocParam | IDynamicDocParam | Array<IStaticDocParamDeprecated>
}

export type IMediaParams = {
    video: boolean
    url: string
    origin: string
    trans: boolean
    bucket: string
    object: string
}

export type IMediaEntity = {
    docId: string
    fileType: string,
    name: string,
    params: IMediaParams,    
    showDelete?: boolean
}

export type IResourceEntity = {
    docId: string
    fileType: string,
    name: string,
    params: IStaticDocParam | IDynamicDocParam | Array<IStaticDocParamDeprecated> | IMediaParams,
    payload: any,
    state: number
}

/**
 * 静态文档转码结果
 */
export interface IStaticDocParam {
    /**
     * 图片url的模板。
     * 格式为: "https://??/?{index}.jpg", "https://??/?{index}.png"
     * 
     * 如果offset为1，则第5页的图片为: "https://??/?6.jpg", 或者"https://??/?6.png"
     */
    template: string,
    /**
     * 图片宽度
     */
    width: number,
    /*
     * 图片高度
     */
    height: number
    /**
     * 文档页数
     */
    pageCount: number
    /**
     * index偏移量
     */
    offset: number
}

/**
 * 3.6.0及之前版本addDoc的参数格式。
 */
export interface IStaticDocParamDeprecated {
    /**
     * 某一页的图片url地址
     */
    url: string
     /**
      * 图片宽度
      */
     width: number,
     /*
      * 图片高度
      */
     height: number
}

/**
 * 动态文档转码结果
 */
export type IDynamicDocParam = {
    /**
     * 动态文档URL
     */
    url: string,
    /**
     * 文档宽度
     */
    width: number,
    /**
     * 文档高度
     */
    height: number,
    /**
     * 文档页面总数
     */
    pageCount: number
}

/**
 * 自定义状态图标自定义配置
 * 
 * @example
 * 
 * ```js
 *  toolCollection.addOrSetTool({
 *      tool: 'custom-state-toggle-editable',
 *      hint: '切换编辑',
 *      clickCb: (currState) => {
 *          if (currState === 'editable') return 'non-editable'
 *          else return 'editable'
 *      },
 *      defaultState: 'editable',
 *      backgroundImageByState: {
 *          'editable': 'url_of_editable_state_icon',
 *          'non_editable': 'url_of_non_editable_state_icon'
 *      }
 * })
 *
 *  toolCollection.on('iconClick', (toolName: string, opt: {
 *     //点击前的state
 *     state: string,
 *     //点击后的state
 *     newState: string
 *  }) => {
 *     if (toolName === 'custom-state-toggle-editable') {
 *         if (opt.newState === 'editable') {
 *             drawPlugin.enableDraw(true)
 *         } else {
 *             drawPlugin.enableDraw(false)
 *         }
 *     }
*   })
 * ```
 */
type ICustomStateUnitOption = {
    /**
     * 根据图标当前状态选择背景图
     */
    backgroundImageByState?: {
        [state: string]: string
    },
    /**
     * 默认状态
     */
    defaultState: string
    /**
     * 点击图标后，给定当前状态，返回下一个状态
     */
    clickCb: (state: string) => string
}

/**
 * 自定义弹窗按钮属性。
 * 
 * 点击自定义弹窗按钮后，用户通过onMount函数将元素挂载到div中。
 * 
 * 点击其它区域时，会卸载弹窗按钮的div。用户可以选择在onUnmount函数中，添加卸载时的一些动作
 * 
 * @example
 * 
 * ```js
 *  //设置图章弹窗。点击后可以选择图章按钮
 *  toolCollection.addOrSetTool({
 *     position: 'left',
 *     item: {
 *         tool: 'custom-popup-macro',
 *         hint: '图章',
 *         backgroundImage: Stamp,
 *         //渲染弹窗内容
 *         onMount: (container) => {
 *             ReactDOM.render(
 *                 <MacroPopup
 *                      drawPlugin={app}
 *                 />, 
 *                 container
 *             )
 *         }
 *     }
 *  })
 * 
 * //MacroPopup是一个React组件，其render函数示意为：
 *  render() {
 *     return (
 *         <div className='stamp-popup'>
 *             <div className='section'>
 *             <div className='stamp-header'>
 *                 图章
 *             </div>
 *         </div>
 *     )
 *  }
 * 
 * 
 * //弹窗的样式:
 *  .stamp-popup {
 *     position: absolute;
 *     left: 50px;
 *     padding: 8px;
 *     background: white;
 *     width: 180px;
 *     transform: translateY(-50%);
 *  }
 * ```
 */
type ICustomPopUnitOption = {
    onMount: (div: HTMLDivElement) => void
    onUnmount?: (div: HTMLDivElement) => void
}


/**
 * 预览图标自定义配置
 * 
 * 控制预览图弹出的方位
 * @example 
 * ```
 * {
 *      tool: 'preview',
 *      hint: '预览弹窗',
 *      previewSliderPosition: 'right'
 * }
 * ```
 */
type IPreviewUnitOption = {
    previewSliderPosition: 'left' | 'right'
}

/**
 * 文档弹窗自定义配置：是否支持动态转码, 是否支持静态转码，是否支持上传音视频，是否支持上传并转码音视频
 * @example 
 * ```
 * {
 *      tool: 'docUpload',
 *      hint: '文档上传',
 *      supportPptToH5: true
 *      supportDocToPic: true
 *      supportUploadMedia: true
 *      supportTransMedia: true
 * }
 * ```
 */
type IDocUploadOption = {
    /**
     * 若缺失，则默认为true
     */
    supportPptToH5?: boolean
    /**
     * 若缺失，则默认为true
     */
    supportDocToPic?: boolean
    /**
     * 若缺失，默认为true
     */
    supportUploadMedia?: boolean
    /**
     * 若缺失，默认为true
     */
    supportTransMedia?: boolean
}

/**
 * 收纳图标自定义配置
 * @example 
 * ```
 * {
 *      tool: 'multiInOne',
 *      hint: '更多',
 *      itemPerRow: 4,
 *      subItems: [
 *          {
 *              item: 'video',
 *              hint: '上传视频‘
 *          },
 *          {
 *              item: 'audio',
 *              hint: '上传音频'
 *          },
 *      ]
 * }
 * ```
 */
type IMultiInOneOption = {
    /**
     * 每一行多少个图标。默认为4个
     */
    itemPerRow?: number
    /**
     * 收纳盒中包含的子图标
     */
    subItems: Array<IUnitOption>
}

/**
 * 图形选择图标的自定义配置
 */
type IShapeSelectOption = {
    subItems: Array<IUnitOption>
}

/**
 * drawPlugin初始化参数
 */
export interface IDrawPluginInitOption {
    /**
     * 白板内部的一些配置项。具体可以参考 drawPlugin.setAppConfig
     */
    appConfig?: Partial<IAppConfig>
    /**
     * 设置初始化的cameraBound
     */
    cameraBound?: ICameraBound
    /**
     * 刚进入房间时，是否将缩放比例设置为100%。默认为true
     * 
     * 如果设置了true，则进入房间时, 不同终端都缩放到100%，此时不同终端上物体大小是一样的
     * 如果设置了false，则进入房间时，不同终端的默认显示区域基本是一致的（由于宽高比不同会有些难以避免的差异），但是缩放比例都会小于100%
     */
    zoomTo1AfterJoin?: boolean

    /**
     * 是否将资源弹窗的上传记录保存在localStorage中，并在初始化时，使用localStorage中的记录还原资源弹窗。默认为true
     */
    cacheUploadDocs: boolean
}

/**
 * 相机的位置
 */
export interface ICameraBound {
    /**
     * 相机中心X
     */
    centerX: number
    /**
     * 相机中心Y
     */
    centerY: number
    /**
     * 相机宽度
     */
    width: number
    /**
     * 相机高度
     */
    height: number
}

export interface IG2WhiteBoardOption {
    /**
     * 云信appkey
     */
    appKey: string
    /**
     * 与用户的账号体系对应的用户标志id。
     * 同一个uid不允许多处同时登陆白板
     */
    uid: number
    /**
     * 文档，图片，音视频上传时，均需要调用云信的服务。调用时需要下面的auth信息
     * 开发者应该通过https请求，从开发者的应用服务器中返回auth信息。
     */
    getAuthInfo: () => Promise<IAuthInfo>
    /**
     * 当白板上传图片、音视频资源需要防盗链支持时，应用开发者应该提供该函数。
     * 
     * 该函数输入为资源的 bucket，以及 object。应用开发者通过调用应用服务器的接口，获取资源的防盗链URL
     * 
     * 防盗链原理请参考: <a href="https://doc.yunxin.163.com/vod/docs/DM5MzI2OTI?platform=server#URL%20%E9%89%B4%E6%9D%83%E7%9A%84%E5%8A%9F%E8%83%BD%E5%8E%9F%E7%90%86">防盗链鉴权</a>
     * 
     * ```js
     * function getAntiLeechInfo(prop, url) {
     *     const wsTime = Math.ceil((Date.now() / 1000))
     *     return fetch('https://YOUR_APPLICATION_SERVER_ADDRESS', {
     *         method: 'post',
     *         headers: {
     *             'content-type': 'application/json'
     *         },
     *         body: JSON.stringify({
     *             wbAppKey: YOUR_APPKEY,
     *             bucketName: prop.bucket,
     *             objectKey: prop.object,
     *             wsTime: wsTime.toString()
     *         })
     *     })
     *         .then(res => {
     *             return res.json()
     *         })
     *         .then(res => {
     *             return {
     *                 url: `${url}?wsSecret=${res.data.wsSecret}&wsTime=${wsTime}`
     *             }
     *         })
     *         .catch(err => {
     *             console.error('getAntiLeechInfo Error', err)
     *             throw err
     *         })
     *     }
     * ```
     */
    getAntiLeechInfo?: (prop: IAntiLeechProp, url: string) => Promise<IAntiLeechInfo>
    /**
     * 昵称
     */
    nickname?: string
    /**
     * 默认为 true，开启后会在控制台打印白板的日志。
     */
    debug: boolean
    /**
     * 是否记录该用户的日志文件。在互动白板场景中，如果需要记录日志，请为房间内所有用户的record都设置为true
     */
    record: boolean
    /**
     * 白板容器
     */
    container: HTMLDivElement
    /**
     * 客户端类型。会影响一些触屏相关的行为
     */
    platform: IPlatform
    /**
     * drawPlugin初始化参数
     */
    drawPluginParams?: IDrawPluginInitOption
    /**
     * 白板的语言。默认为'zh'
     */
    lang?: 'zh' | 'en'
}

export interface IG1WhiteBoardOption {
    /**
     * 云信appkey
     */
    appKey: string
    /**
     * im账号
     */
    account: string
    /**
     * im token
     */
    token: string
    /**
     * 文档，图片，音视频上传时，均需要调用云信的服务。调用时需要下面的auth信息
     * 开发者应该通过https请求，从开发者的应用服务器中返回auth信息。
     */
    getAuthInfo: () => Promise<IAuthInfo>
    /**
     * 当白板上传图片、音视频资源需要防盗链支持时，应用开发者应该提供该函数。
     * 
     * 该函数输入为资源的 bucket，以及 object。应用开发者通过调用应用服务器的接口，获取资源的防盗链URL
     * 
     * 防盗链原理请参考: <a href="https://doc.yunxin.163.com/vod/docs/DM5MzI2OTI?platform=server#URL%20%E9%89%B4%E6%9D%83%E7%9A%84%E5%8A%9F%E8%83%BD%E5%8E%9F%E7%90%86">防盗链鉴权</a>
     * 
     * ```js
     * function getAntiLeechInfo(prop, url) {
     *     const wsTime = Math.ceil((Date.now() / 1000))
     *     return fetch('https://YOUR_APPLICATION_SERVER_ADDRESS', {
     *         method: 'post',
     *         headers: {
     *             'content-type': 'application/json'
     *         },
     *         body: JSON.stringify({
     *             wbAppKey: YOUR_APPKEY,
     *             bucketName: prop.bucket,
     *             objectKey: prop.object,
     *             wsTime: wsTime.toString()
     *         })
     *     })
     *         .then(res => {
     *             return res.json()
     *         })
     *         .then(res => {
     *             return {
     *                 url: `${url}?wsSecret=${res.data.wsSecret}&wsTime=${wsTime}`
     *             }
     *         })
     *         .catch(err => {
     *             console.error('getAntiLeechInfo Error', err)
     *             throw err
     *         })
     *     }
     * ```
     */
    getAntiLeechInfo?: (prop: IAntiLeechProp, url: string) => Promise<IAntiLeechInfo>
    /**
     * 昵称
     */
    nickname?: string
    /**
     * 默认为 true，开启后会在控制台打印白板的日志。
     */
    debug: boolean
    /**
     * 是否记录该用户的日志文件。在互动白板场景中，如果需要记录日志，请为房间内所有用户的record都设置为true
     */
    record: boolean
    /**
     * 白板容器
     */
    container: HTMLDivElement
    /**
     * 客户端类型。会影响一些触屏相关的行为
     */
    platform: IPlatform
    /**
     * drawPlugin初始化参数
     */
    drawPluginParams?: IDrawPluginInitOption
    /**
     * 白板的语言。默认为'zh'
     */
    lang?: 'zh' | 'en'
}

/**
 * 图片、音视频资源存储参数。用于获取完整的防盗链地址
 * 
 * 防盗链原理请参考: <a href="https://doc.yunxin.163.com/vod/docs/DM5MzI2OTI?platform=server#URL%20%E9%89%B4%E6%9D%83%E7%9A%84%E5%8A%9F%E8%83%BD%E5%8E%9F%E7%90%86">防盗链鉴权</a>
 */
export interface IAntiLeechProp {
    bucket: string
    object: string
}

/**
 * 云信 NOS 存储计算防盗链token所需参数
 */
export interface IAntiLeechProp {
    bucket: string
    object: string
}

/**
 * getAntiLeechInfo 返回的结果。url为带有防盗链参数的地址
 * 
 * 防盗链原理请参考: <a href="https://doc.yunxin.163.com/vod/docs/DM5MzI2OTI?platform=server#URL%20%E9%89%B4%E6%9D%83%E7%9A%84%E5%8A%9F%E8%83%BD%E5%8E%9F%E7%90%86">防盗链鉴权</a>
 */
export interface IAntiLeechInfo {
    url: string
}


export interface IAuthInfo {
    /**
     * sha1(appsecret + nonce + curTime)
     */
    checksum: string
    /**
     * 长度小于128的随机字符串
     */
    nonce: string
    /**
     * 当前UTC时间戳。从1970年1月1日0点0分0秒开始到现在的秒数
     * 可以使用 Math.floor(Date.now() / 1000)
     */
    curTime: number
}

export interface IJoinRoomCallback {
    /**
     * 房间状态变为连接
     */
    onconnected?: (isReconnect: boolean) => void
    /**
     * 房间状态变为重连，房间重连时，不能对房间进行编辑
     */
    onwillreconnect?: () => void
    /**
     * 房间断开连接
     */
    ondisconnected?: (err: any) => void
    /**
     * 房间同步结束。房间同步时，不能够修改房间内容
     */
    onSyncFinish?: () => void
    /**
     * 房间开始同步。房间同步时，不能够修改房间内容
     */
    onSyncStart?: () => void
}

export interface IAppConfig {
    /**
     * 白板背景色
     * 
     * API CHANGE: 
     * 
     * 3.6.0版本之前，请使用canvas_bg_color
     * 
     * 3.6.0版本之后，请使用canvasBgColor。3.6.0之后canvas_bg_color依旧可以使用，但是未来可能不再支持
     */
    canvasBgColor: string,
    /**
     * 共享鼠标位置时，是否显示鼠标所有者的昵称。和{@link DrawPlugin.setShowCursor}配合使用
     */
    showCursorNickname: boolean,
    /**
     * 显示选择框时，是否显示选择框所有者的昵称
     */
    showSelectNickname: boolean,
    /**
     * 显示激光笔时，是否显示激光笔所有者的昵称
     */
    showLaserNickname: boolean
    /**
     * 房间内存在主播时（视角跟随），是否允许其他用户设置自己为主播
     */
    allowReplaceActiveBroadcaster: boolean
    /**
     * 缩放灵敏度设置。这个值应该大于0，小于1。默认为0.91
     */
    zoomSensitivity: number
    /**
     * 该配置会影响addDoc时，添加静态文档的参数。
     * 
     * 若你的所有客户白板版本都大于等于3.6.1, 则你应该使用'template'
     * 若你的sdk版本小于3.6.1, 或者你需要和低版本的白板sdk互通，则你应该使用array
     * 
     * 注意，如果使用array，在加载页数很大（如大于100）的静态文档时，可能会存在性能问题。
     */
    staticDocType: 'template' | 'array'
    /**
     * 预览图的模式
     * fitDoc: 在预览图中，文档显示最大化
     * fitContainer: 在预览图中，当前白板页的容器显示最大化
     */
    previewMode: 'fitDoc' | 'fitContainer'
    /**
     * 预览图中是否包含自定义背景函数的绘制。默认为false
     */
    previewCustomBg: boolean
    /**
     * 默认为true
     * true: 容器resize时，容器内元素大小不变
     * false：容器resize时，容器所代表的世界坐标系的宽度不变. 如果是等比例缩放，容器大小变化，则容器内元素内容和容器的相对位置不变
     */
    disableAutoResize?: boolean

    /**
     * 默认为-1。
     * 如果该值 <= 0, 则认为不对涂鸦进行合并。
     * 如果该值 > 0, 则当两次涂鸦之间的间隔小于drawMergeInterval时，且第一笔的最后一点，和第二笔的第一点距离小于drawMergeDist时，
     * 认为两次涂鸦为同一笔操作
     */
    drawMergeInterval: boolean

    /**
     * 默认为200。仅当drawMergeInterval > 0时有效
     * 注意该距离为两点之间的曼哈顿距离。即 Math.abs(x1 - x2) + Math.abs(y1 - y2)。这里的x，y均为屏幕上面的css像素点距离
     */
    drawMergeDist: number

    /**
     * 默认为false。仅当drawMergeInterval > 0时有效
     * 设置为true时，会在涂鸦时打印两笔之间的时间差与曼哈顿距离，这样方便产品/开发设置合适的drawMergeInterval，以及drawMergeDist。
     */
    drawMergeDebug: boolean


    /**
     * 默认为intersect
     * 
     * intersect：当选择矩形和图形的包含盒相交时，即为选中
     * contain:   当选择矩形完全包含图形的包含盒时为选中
     */
    selectMode: 'intersect' | 'contain'

    /**
     * 默认为5000（5s）
     * 
     * 资源加载失败后，隔多久尝试重新加载。注意第一次失败后，会立即开始第二次重新加载。该参数仅影响第三次，第四次加载资源
     */
    resRetryInterval: number

    /**
     * 默认为false
     * 
     * 图片资源第一次加载会使用跨域方式加载，如果加载失败，第二次会使用非跨域方式加载。如果设置为true，则无论失败几次，都会一直使用跨域方式加载
     */
    resRetryCors: boolean

    /**
     * 音视频转码模板id
     * 
     * 参考该地址创建：https://doc.yunxin.163.com/vod/docs/Dc5NDE5NjM?platform=server
     * 参数为:
     *  {
            "presetName":"白板视频转码模板",
            "sdMp4":1,
            "hdMp4":0,
            "shdMp4":0,
            "uhdMp4": 0,
            "sdFlv":0,
            "hdFlv":0,
            "shdFlv":0,
            "sdHls":0,
            "hdHls":0,
            "shdHls":0,
            "transConfig": [{
                "presetType": 1,
                "video": {
                    "maxWidth": "auto",
                    "maxHeight": "auto"
                } 
            }]
        } 
    * 
    */
    presetId: number

    /**
     * 是否将资源弹窗的上传记录保存在localStorage中，并在初始化时，使用localStorage中的记录还原资源弹窗。默认为true
     */
    cacheUploadDocs: boolean

    /**
     * 是否确保新增的文档名称唯一。默认为false，即可用添加同名文档。
     */
    uniqueDocName: boolean

    /**
     * videFitStrategy会影响其他端添加视频后，本端调整视角的策略：
     * 
     * 0: 添加视频后，视角不做任何变化
     * 1: 移动视角，使得视角包含新增视频，以及当前画布上所有内容
     * 2: 移动视角，使得新增视频居中，同时视频相对容器较长的一边，占据容器宽高的一定百分比（比如value为1，则占据100%。value为0.5，则占据50%）。
     * 
     * 移动端默认值为: 
     * {
     *      type: 2,
     *      value: 1
     * }
     * 
     * 桌面端默认值为:
     * {
     *      type: 2
     *      value: 0.5
     * }
     */
    videoFitStrategy: {
        type: 0 | 1 | 2,
        value?: number
    }

    /**
     * audioFitStrategy会影响其他端添加音频后，本端调整视角的策略：
     * 
     * 0: 添加音频后，视角不做任何变化
     * 1: 移动视角，使得视角包含新增音频，以及当前画布上所有内容
     * 2: 移动视角，使得新增视频居中，同时音频相对容器较长的一边，占据容器宽高的一定百分比（比如value为1，则占据100%。value为0.5，则占据50%）。
     * 
     * 移动端默认值为: 
     * {
     *      type: 2,
     *      value: 1
     * }
     * 
     * 桌面端默认值为:
     * {
     *      type: 2
     *      value: 0.5
     * }
     */
    audioFitStrategy: {
        type: 0 | 1 | 2
        value?: number
    }
    /*
     * 默认为 2
     * 
     * 资源如果加载失败，默认允许重试多少次
     */
    resMaxRetry: number

    /**
     * 上传资源时，是否添加防盗链。默认为 false。如果要使用防盗链，首先需要在云信业务后台，开通点播防盗链能力(URL鉴权防盗链)
     */
    nosAntiLeech: boolean

    /**
     * 防盗链资源失效时间，单位为（s)，默认为7200
     */
    nosAntiLeechExpire: number
    /**
     * 文档的默认缩放大小是否为 100%。
     * 
     * 默认为 true，即页面刚好显示完整文档时，页面的默认缩放大小为 100%。
     * 
     * 3.9.7 新增 feature。此前，文档刚好显示时的缩放比，取决于文档本身的大小，和容器的大小之间的比例。
     * 
     * 如果你需要回到 3.9.6 之前的配置，请设置 isDocZoomLevel1 为 false
     */
    isDocZoomLevel1: boolean
    /**
     * 最大缩放比例。默认为 4
     */
    cameraMaxZoom: number
    /**
     * 最小缩放比例。默认为 0.25
     */
    cameraMinZoom: number
    /**
     * 默认白板的显示名。设置显示名仅在当前客户端有效，不会影响其他客户端
     */
    defaultBoardName: string
}

export interface IBoardInfos {
    /**
     * 文档内部名称
     */
    currBoard: string
    /**
     * 文档显示名称
     */
    currBoardDisplayName: string
    /**
     * 所有文档的名称
     */
    boardNames: string[]
    /**
     * 所有文档的显示名称
     */
    boardDisplayNames: string[]
}

export interface IPageInfos {
    /**
     * 当前页面的索引
     */
    activeIndex: number
    /**
     * 每个页面的payload数组
     */
    pagePayloads: Array<any>
}

export interface IShowToastOption {
    /**
     * Toast的文本
     */
   msg: string,
   /**
    * Toast显示时间长度，单位为秒, 默认为2s
    */
   time?: number,
   /**
    * Toast类型，默认为info
    */
   type?: 'info' | 'warn' | 'success' | 'error',
   /**
    * Toast距离页面顶部的距离，单位为px，默认为30
    */
   top?: number,
   /**
    * Toast的类型
    * 
    * *************************************************
    * ****************网络请求相关Toast******************
    * *************************************************
    * SYNCHRONIZING: 同步数据中
    * 
    * ON_CONNECTED:  白板已连接
    * 
    * ON_WILL_RECONNECT: 白板即将重连
    * 
    * ON_DISCONNECTED: 白板已断开连接
    * 
    * NETWORK_INSTABLE: 网络状态不稳定
    * 
    * SYNC_FAIL: 同步失败
    * 
    * DELAY_DISPATCH_WHILE_NETWORK_INSTABLE: 因网络不稳定推迟文档、音视频、图片的添加提示
    * 
    * *************************************************
    * ****************视角类型Toast**********************
    * *************************************************
    * 视角类操作都带有参数{@link IVisionArgs}
    * 
    * STOP_BROADCAST、RECEIVE_STOP_BROADCAST额外包含：
    * 
    * prevBroadcasterName与prevBroadcaster属性
    * *************************************************
    * 
    * START_BROADCAST: 主播开始同步自己视角
    * 
    * STOP_BROADCAST: 主播停止同步自己视角
    * 
    * SWITCH_TO_FOLLOWER: 跟随主播视角（从自由视角切换至跟随模式）
    * 
    * SWITCH_TO_FREE_OBSERVER: 停止跟随主播视角（从跟随模式切换至自由视角）
    * 
    * NOT_ALLOWED_REPLACE_ACTIVE_BROADCASTER: 已存在主播，不允许替换主播
    * 
    * NOT_ALLOWED_SET_CAMERA_WHILE_FOLLOW_BROADCASTER: 正跟随主播视角，不允许调整本端视角
    * 
    * RECEIVE_STOP_BROADCAST: 收到主播停止视角跟随模式的消息
    * 
    * RECEIVE_START_BROADCAST: 收到主播开始同步消息，本地变为跟随模式
    * 
    * CURRENT_USER_IS_BROADCASTER: 用户重新进房后，Toast告知主播目前正在视角同步
    * 
    * CURRENT_USER_IS_FOLLOWER: 用户重新进房后，Toast通知用户正在跟随主播
    * 
    * CURRENT_USER_IS_FREE_OBSERVER: 用户重新进房后，Toast通知用户当前为自由视角（只在录像回放时用到）
    * 
    * *************************************************
    * *************课件上传转码Toast*********************
    * *************************************************
    * FILE_IS_EMPTY: 选择的文件为空
    * FILE_SIZE_EXCEED_LIMIT: 文件大小超过限制
    * FILE_ACCEPTED_TYPE_LIMIT: 文件类型不匹配
    * FILE_UPLOAD_FAIL: 文件上传失败
    * FILE_IS_UPLOADING: 文件正在上传中
    * FILE_TRANSCODE_SUCCEED: 文件转码成功
    * FILE_TRANSCODE_FAIL: 文件转码失败
    * 
    * *************************************************
    * *************多媒体文件上传Toast********************
    * *************************************************
    * VIDEO_UPLOAD_FAIL: 视频上传失败
    * AUDIO_UPLOAD_FAIL: 音频上传失败
    * VIDEO_TYPE_NOT_ALLOWED: 视频类型不允许
    * AUDIO_TYPE_NOT_ALLOWED: 音频类型不允许
    * PIC_UPLOAD_FAIL: 图片上传失败
    * ONE_MEDIA_LIMIT: 同一页面只允许一个音视频资源
    * PASTE_IMG_UPLOAD_ERROR: 黏贴图片上传失败
    * PASTE_IMG_UPLOAD_WAIT: 黏贴图片上传等待中
    * 
    * 
    * EXPORT_IMG_ERROR: 导出图片失败
    */
   msgType?: string,
   /**
    * showToast时添加的参数。主要用途为使用toast拦截函数时，可以根据参数构建toast的信息
    */
   args?: object
}

/**
 * broadcasterName: 主播名称。优先使用昵称(nickname), 若初始化时未设置nickname，则为主播uid
 * 
 * broadcaster: 主播uid
 */
type IVisionArgs = {
    broadcasterName: string | undefined
    broadcaster: string
}

/**
 * 宏教具的属性
 * @example
 * 
 * 下面的示例代码设置了如下属性：
 * 1. 点击方式添加图片(clkAdd=true & dragAdd=false)
 * 2. 初始图片大小随缩放变化(size=relative)
 * 3. 缩放100%时图片大小为图片固有尺寸（未设置attr.width, attr.height)
 * 4. 鼠标指针和图片一致(cursor)
 * ```
 * drawPlugin.setTool('macro', {
 *      cursor: "url('https://jdvodj7gqfxcq.vod.126.net/jdvodj7gqfxcq/840ac4e9216c4bbdad10dd2f168c2f15.png'), auto",
 *      size: 'relative',
 *      type: 'image',
 *      clkAdd: true,
 *      dragAdd: false,
 *      attr: {
 *          url: "https://jdvodj7gqfxcq.vod.126.net/jdvodj7gqfxcq/840ac4e9216c4bbdad10dd2f168c2f15.png"
 *      }
 * })
 * ```
 */
export type IMacroPayload = IMacroCommonProp & {attr: IMacroImageProp | IMacroTextProp}

type IMacroCommonProp = {
    /**
     * 宏教具预添加内容类型
     */
    type: 'image' | 'text'
    /**
     * 是否支持点击添加内容。
     * 当type = 'text'时，clkAdd必须为true，否则无法添加文本
     */
    clkAdd: boolean,
    /**
     * 是否支持拖拽添加内容
     */
    dragAdd: boolean
    /**
     * 只在类型为image, 且添加方式为点击添加时生效。
     * 
     * 默认为relative。
     * relative: 在不同缩放比时，多次添加的元素，在同一时刻的显示大小相同
     * absolute：在不同缩放比时，多次添加的元素，在添加的时刻的大小相同
     */
    size?: 'absolute' | 'relative'
    /**
     * 设置宏教具时的鼠标指针。该属性的值和css中的cursor值语义一致。该属性有以下说明：
     * 1. cursor为图片地址时，图片的尺寸不能大于128 * 128
     * 2. Safari中图片的偏移量若为负数，会出现问题
     */
    cursor?: string
    /**
     * origin只在点击添加元素时有效。
     * 
     * origin表示元素和鼠标的相对关系。默认为: {x: 0, y: 0}，即点击后，鼠标位于元素的左上角。
     * x、y的取值范围为0到1
     */
    origin?: {
        x: number,
        y: number
    }
}

/**
 * 宏教具添加图片时的属性。
 * 
 * 当width，height都缺失时，使用图片固有宽高。
 * 
 * 当width或者height缺失其一时，缺失的属性根据图片宽高比调整
 */
type IMacroImageProp = {
    width?: number
    height?: number
    /**
     * 图片url地址。请确保图片地址无访问限制
     */
    url: string
} 

/**
 * 宏教具添加文本时的属性
 */
type IMacroTextProp = {
    /**
     * 文本长度限制为1-100
     */
    text: string
    /**
     * fontSize长度限制为12-300。默认为32
     */
    fontSize?: number
    /**
     * 字体。缺失时使用白板当前的默认字体
     */
    fontFamily?: string
    /**
     * 文本颜色。缺失时使用白板当前的默认颜色
     */
    stroke?: string
    /**
     * 文本背景色。缺失时使用白板当前的默认背景色
     */
    fill?: string
}

/*
 * 资源的 metadata。其中 loaded 表示资源是否已加载。type有三种类型：'image', 'video', 'audio'
 */
export type IResourceMetaData = {
    type: "image";
    url: string;
    loaded: boolean;
    width: number;
    height: number;
} | {
    type: "video";
    url: string;
    loaded: boolean;
    width: number;
    height: number;
    duration: number;
} | {
    type: "audio";
    url: string;
    loaded: boolean;
    duration: number;
}