/*
 * Copyright (c) 2021 NetEase, Inc.  All rights reserved.
 */
import { IAppConfig, IBoardInfos, ICameraBound, IPageInfos, IStaticDocParam, IStaticDocParamDeprecated, IFont, IStyle, IMacroPayload, IResourceMetaData, IAntiLeechProp } from "./types";

/**
 * 绘制模块
 */
export interface DrawPlugin {
    /**
     * 返回当前各类元素的默认样式
     */
    getDefStyles(): IStyle
    /**
     * 获取当前教具名称
     */
    getCurrTool(): string

    /**
     * 获取当前可以redo的次数
     */
    getRedoCount(): number

    /**
     * 获取当前可以undo的次数
     */
    getUndoCount(): number

    /**
     * 获取当前页面中所有元素的id和类型，以及是否可见
     */
    getPageElementInfos(): Array<{
        id: string,
        type: string,
        visible: boolean
    }>

    /**
     * 根据 url，以及资源类型，判断 白板示例 是否已经加载了该资源。如果资源已加载，则返回的结果中 loaded 为 true，反之则为 false
     */
    getResourceMetadata(opt: {
        url: string, 
        type: 'image' | 'video' | 'audio'
    }):  IResourceMetaData

    /**
     * 白板中是否存在元素，是否可以执行清空操作
     */
    isClearAvailable(): boolean

    /**
     * 获取当前选中元素的id列表
     */
    getSelectedIds(): string[]

    /**
     * 获取当前的缩放比例。1代表未缩放，即工具栏中的100%
     */
    getZoomFactor(): number

    /**
     * 获取当前客户端的视角相关的信息。
     */
    getVisionState(): {
        /**
         * broadcaster: 当前用户为主播，其他用户跟随当前用户视角
         * 
         * follower: 当前用户跟随主播视角
         * 
         * freeObserver：当前用户自由视角
         */
        mode: 'broadcaster' | 'follower' | 'freeObserver'
        /**
         * 主播名称。优先使用昵称(nickname), 若初始化时未设置nickname，则为主播uid
         */
        broadcasterName: string | undefined
        /**
         * 主播uid
         */
        broadcaster: string | undefined
    }

    /**
     * 当前页面是否有背景图
     */
    hasBackground(): boolean

    /**
     * 当前Board中是否有动态ppt
     */
    hasTransDoc(): boolean

    /**
     * 获取当前Board的动画位置。如果当前Board不是动态ppt页面，则返回null
     */
    getAnimInfos(): null | {
        pageIndex: number
        animIndex: number
        animState: 'start' | 'end'
    }

    /**
     * 获取指定Board的页面结构。若参数未设置，则返回当前Board的结构。
     */
    getPageInfos(boardName?: string): IPageInfos

    /**
     * 获取当前房间的Board结构。包含Board名字列表，以及当前展示的Board
     */
    getBoardInfos(): IBoardInfos

    /**
     * 设置昵称
     * @param name 
     */
    setNickName(name: string): void

    /**
     * 设置一些应用属性。这些属性只对当前客户端有影响。
     * @param opt 
     * 
     * @example
     * 设置白板背景色。注意若sdk版本小于3.6.0，请使用canvas_bg_color设置白板背景颜色
     *
     * ```
     * setAppConfig({
     *  canvasBgColor: 'rgb(255, 255, 255)'
     * })
     * ```
     */
    setAppConfig(opt: Partial<IAppConfig>): void

    /**
     * 是否允许本地编辑白板
     * @param enable 
     */
    enableDraw(enable: boolean): void

    /**
     * 添加图片至白板中
     */
    addImage(opt: {
        /**
         * 图片URL地址。注意如果site部署在https协议上，图片也必须是https地址。
         * 
         * 另注：如果图片地址跨域，如果需要导出图片的话，或者进行白板转流，则必须保证图片服务允许跨域
         */
        url: string,
        /**
         * 如果没有设置pageIndex，则默认添加图片至选定Board的当前页面
         */
        pageIndex?: number,
        /**
         * 如果没有给boardName, 则默认添加图片至当前Board
         */
        boardName?: string
        /**
         * 防盗链参数。
         */
        antiLeechProp?: IAntiLeechProp
    }): void

    /**
     * 添加视频
     */
    addVideo(opt: {
        /**
         * 视频资源的url地址
         */
        url: string,
        /**
         * 视频格式。会用于设置video标签中source的type属性。
         * 目前支持mp4, quicktime
         */
        sourceType: string,
        /**
         * 视频标题
         */
        title?: string
        /**
         * 如果没有设置pageIndex，则默认添加图片至选定Board的当前页面
         */
        pageIndex?: number,
        /**
         * 如果没有给boardName, 则默认添加图片至当前Board
         */
        boardName?: string
        /**
         * 防盗链参数。
         */
        antiLeechProp?: IAntiLeechProp
    }): void

    /**
     * 添加视频
     */
    addAudio(opt: {
        /**
         * 音频资源的url地址
         */
        url: string,
        /**
         * 视频格式。会用于设置video标签中source的type属性。
         * 目前支持mp3, aac等格式
         */
        sourceType: string,
        /**
         * 音频标题
         */
        title?: string
        /**
         * 如果没有设置pageIndex，则默认添加图片至选定Board的当前页面
         */
        pageIndex?: number,
        /**
         * 如果没有给boardName, 则默认添加图片至当前Board
         */
        boardName?: string
        /**
         * 防盗链参数。
         */
        antiLeechProp?: IAntiLeechProp
    }): void

    /**
     * 设置文本的字体列表。第一个字体将作为默认字体
     * @example
     * ```
     * setFontFamilies([
     *    {displayName: 'Helvetica', fontName: 'Helvetica'},
     *    {displayName: 'Times New Roman', fontName: 'Times New Roman'},
     *    {displayName: 'Garamond', fontName: 'Garamond'},
     *    {displayName: 'Courier New', fontName: 'Courier New'},
     *    {displayName: 'Noto Sans SC', fontFace: [
     *      {
     *          url: `https://www.example.com/Noto_Sans_SC/NotoSansSC-Regular.woff2`, format: 'woff2',
     *      },
     *      {
     *          url: `https://www.example.com/Noto_Sans_SC/NotoSansSC-Regular.woff`, format: 'woff',
     *      }
     *    ]}
     * ])
     * ```
     */
    setFontFamilies(fontFamilies: Array<IFont>): void

    /**
     * 返回当前的字体列表。用户可以基于该列表设置新的字体列表
     */
    getFontFamilies(): Array<IFont>

    /**
     * 获取当前自定义背景的名字。名字来源于{@link setCustomBackground}的第三个参数
     */
    getBgRendererName(): string

    /**
     * 删除自定义背景绘制。设置后再次调用{@link getBgRendererName}时，会返回undefined
     */
    unsetCustomBackground(): void

    /**
     * 设置自定义背景绘制。用户可以使用此函数添加网格线、网格点等背景。
     * 
     * 注意设置只对本地有效。不同客户端可以独立设置自己的背景图
     * 
     * coodinate为world时，绘制时的ctx已经转换为白板坐标系。容器的四个角落可以根据参数中的rect确定
     * 
     * 下面是设置相对网格线的代码
     * 
     * @param coodinate 背景图类型
     * @param customFn 自定义背景绘制函数。如果类型为string，则会先使用eval函数提取函数
     * @param bgName 自定义背景名字。使用{@link getBgRendererName}可以返回该字段。可以用这个字段判断当前的自定义背景类型
     * 
     * @example
     * 下面是工具栏中相对网格线背景图的绘制方法
     * ```js
     * 
     * //
     * //寻找网格线的最佳gap
     * //最好的gap应该不太大，也不太小。最后需要满足： base  < gap < worldStressGap * base
     * //如果base为30，worldStressGap为5， 则 30 < gap < 150
     * //当gap逐渐变小，直至快小于base时，小网格将消失，大网格变为基线gap
     * //当gap逐渐变大，直至大于base * worldStressGap时，大网格中生出小网格
     * //
     * function findBestGap(opt: any, base: number, worldStressGap: number) {
     *      const {width, rect} = opt
     *      let gapInWorld = base
     *      let lineCount, gapInContainer: number
     *      
     *      while (true) {
     *          lineCount = rect.width / gapInWorld
     *          gapInContainer = width / lineCount
     *          if (gapInContainer < base) {
     *              gapInWorld *= worldStressGap
     *          } else if (gapInContainer > base * worldStressGap) {
     *              gapInWorld /= worldStressGap
     *          } else {
     *              break
     *          }
     *      }
     *      return {
     *          gapInWorld,
     *          gapInContainer
     *      }
     *  }
     * 
     * //找到起始的sx，sy
     * //即屏幕左上角第一个sx，sy的位置
     * //注意，需要从0，0开始找，这样不管白板如何缩放平移，只要gap按base的倍数变化，网格线的位置始终不会变
     * function findSxy(opt: any, gap: number) {
     *      const {rect} = opt
     *      let sx = 0
     *      let sy = 0
     *      let rectSx = rect.centerX - rect.width/2
     *      let rectSy = rect.centerY - rect.height/2
     *      while (true) {
     *          if (sx > rectSx) {
     *              sx -= gap
     *          } else if (sx + 2 * gap < rectSx) {
     *              sx += gap
     *          } else {
     *              break
     *          }
     *      }
     *      
     *      while (true) {
     *          if (sy > rectSy) {
     *              sy -= gap
     *          } else if (sy + 2 * gap < rectSy) {
     *              sy += gap
     *          } else {
     *              break
     *          }
     *      }
     *      
     *      return {sx, sy}
     * }
     * 
     * 
     *  drawPlugin.setCustomBackground('world', (opt) => {
     *      const rect = opt.rect
     *      const ctx = opt.ctx
     *      const worldGapBase = 35
     *      const worldStressGap = 5
     *      const maxAlpha = 0.2
     * 
     *      let {gapInWorld, gapInContainer} = findBestGap(opt, worldGapBase, worldStressGap)
     *       
     *      //gap *= worldStressGap是为了固定粗网格线的位置
     *      const {sx, sy} = findSxy(opt, gapInWorld * worldStressGap)
     *      ctx.beginPath()
     *
     *      //
     *      // 先绘制小网格线
     *      //
     *      let count = -1
     *      for (let i = 0; sx + i < rect.centerX + rect.width/2; i+= gapInWorld) {
     *          count++
     *          if (count % worldStressGap === 0) continue  //每5个网格线使用透明度低的线条绘制
     *          ctx.moveTo(sx + i, sy)
     *          ctx.lineTo(sx + i, rect.centerY + rect.height/2)
     *      }
     *      count = -1
     *      for (let j = 0; sy + j < rect.centerY + rect.height/2; j+= gapInWorld) {
     *          count++
     *          if (count % worldStressGap === 0) continue  //每5个网格线使用透明度低的线条绘制
     *          ctx.moveTo(sx, sy + j)
     *          ctx.lineTo(rect.centerX + rect.width/2, sy + j)
     *      }
     *      ctx.lineWidth = 1/opt.zoom
     * 
     *      //网格越接近，alpha越小
     *      const alpha = Math.sqrt(Math.min((gapInContainer - worldGapBase) / (worldGapBase * (worldStressGap - 1)), 1)) * maxAlpha
     *      ctx.strokeStyle = `rgba(120, 120, 120, ${alpha})`
     *      ctx.stroke()
     * 
     *      //
     *      // 再绘制在5 * gap上面的大网格
     *      //
     *      ctx.beginPath()
     *      for (let i = 0; sx + i < rect.centerX + rect.width/2; i+= worldStressGap * gapInWorld) {
     *          ctx.moveTo(sx + i, sy)
     *          ctx.lineTo(sx + i, rect.centerY + rect.height/2)
     *      }
     *      for (let j = 0; sy + j < rect.centerY + rect.height/2; j+= worldStressGap * gapInWorld) {
     *          ctx.moveTo(sx, sy + j)
     *          ctx.lineTo(rect.centerX + rect.width/2, sy + j)
     *      }
     *      ctx.lineWidth = 1/opt.zoom
     *      ctx.strokeStyle = `rgba(120, 120, 120, ${maxAlpha})`
     *      ctx.stroke()
     * }, 'line-world')
     * ```
     */
    setCustomBackground(coodinate: 'world', customFn: (opt: {
        /**
         * 容器宽度 = DPI * 容器css width
         */
         width: number,
         /**
          * 容器高度 = DPI * 容器css height
          */
         height: number,
         /**
          * devicePixelRatio。
          */
         DPI: number,
        /**
         * 容器在白板坐标系中的范围
         */
        rect: {
            /**
             * 容器当前白板坐标系的中点x
             */
            centerX: number,
            /**
             * 容器当前白板坐标系的中点y
             */
            centerY: number,
            /**
             * 容器在白板坐标系中的宽度
             */
            width: number,
            /**
             * 容器在白板坐标系中的高度
             */
            height: number
        },
        /**
         * 白板当前的缩放量
         */
        zoom: number,
        /**
         * 绘制的canvas的句柄
         */
        ctx: CanvasRenderingContext2D
    }) => void | string, bgName: string): void


    /**
     * 设置自定义背景绘制。用户可以使用此函数添加网格线、网格点等背景。
     * 
     * 注意设置只对本地有效。不同客户端可以独立设置自己的背景图
     * 
     * coodinate为container时，绘制时的ctx使用容器坐标系。容器的位置为(0, 0)到(DPI * width, DPI * height)
     * 
     * 下面是设置绝对网格线的代码
     * 
     * @param coodinate 背景图类型
     * @param customFn 自定义背景绘制函数。如果类型为string，则会先使用eval函数提取函数
     * @param bgName 自定义背景名字。使用{@link getBgRendererName}可以返回该字段。可以用这个字段判断当前的自定义背景类型
     * 
     * @example
     * 下面是工具栏中绝对网格线背景图的绘制方法
     * ```js
     * 
     * drawPlugin.setCustomBackground('container', (opt) => {
     *      const w = opt.width * opt.DPI
     *      const h = opt.height * opt.DPI
     *      const DPI = opt.DPI
     *      const ctx = opt.ctx
     * 
     *      //乘以DPI保证在不同机器上的显示效果一样
     *      const gap = 90 * DPI
     *      ctx.beginPath()
     *      for (let i = 0; i < w; i+= gap) {
     *          ctx.moveTo(i, 0)
     *          ctx.lineTo(i, h)
     *      }
     *      for (let i = 0; i < h; i+= gap) {
     *          ctx.moveTo(0, i)
     *          ctx.lineTo(w, i)
     *      }
     *      ctx.strokeStyle = `rgba(0, 0, 0, 0.15)`
     *      ctx.stroke()
     * }, 'line-container')
     * ```
     */
    setCustomBackground(coodinate: 'container', customFn: (opt: {
        /**
         * 容器宽度 = DPI * 容器css width
         */
        width: number,
        /**
         * 容器高度 = DPI * 容器css height
         */
        height: number,
        /**
         * devicePixelRatio。
         */
        DPI: number,
        /**
         * 白板当前的缩放量
         */
        zoom: number,
        /**
         * 绘制的canvas的句柄
         */
        ctx: CanvasRenderingContext2D
    }) => void | string, bgName: string): void

    /**
     * 设置当前页面的背景图。图片默认添加在白板的世界坐标系的中心位置，即白板未进行缩放平移时的中心位置
     * @example
     * ```
     * setPageBackground({
     *  url: 'xxxx',
     *  width: 1000,
     *  height: 1000
     * })
     * ```
     */
    setPageBackground(opt: {
        /**
         * 背景图URL
         */
        url: string,
        /*
         * 背景图宽度
         */
        width: number
        /*
         * 背景图宽度
         */
        height: number
        /**
         * 防盗链参数
         */
        antiLeechProp?: IAntiLeechProp
    }): void

    /**
     * 设置教具。教具为工具栏中支持的，非一次性动作的工具栏图标
     * @param toolName 目前支持的教具有：select, pen, pen-pressure, line, line-arrow, rect, ellipse, laser, text, element-eraser, pan, macro
     * 
     * 如果设置教具为macro，可以预先设置一些文本或者图片元素。然后通过点击或者拖拽的方式添加至画布中
     */
    setTool(toolName: string, payload?: IMacroPayload): void

    /**
     * 设置涂鸦（直线）颜色、设置图形颜色、设置连接颜色
     * 
     * @example
     * 默认工具栏调色盘中的颜色为：
     * ```
     * [
     *     'rgb(0,0,0)',
     *     'rgb(255,255,255)',
     *     'rgb(224,32,32)',
     *     'rgb(250,100,0)',
     *     'rgb(247,181,0)',
     *     'rgb(109,212,0)',
     *     'rgb(68,215,182)',
     *     'rgb(50,197,255)',
     *     'rgb(0,145,255)',
     *     'rgb(98,54,255)',
     *     'rgb(182,32,224)',
     *     'rgb(109,114,120)'
     * ]
     * ```
     */
    setColor(color: string): void

    /**
     * 设置涂鸦（直线）、图形、或者连接的颜色
     * @param type 
     * @param color 
     */
    setStrokeColor(type: 'link' | 'shape' | 'pen', color: string): void

    /**
     * 设置涂鸦（直线）、连接的线段粗细。或者设置图形的边框粗细
     */
    setStrokeWidth(type: 'link' | 'shape' | 'pen', width: number): void

    /**
     * 设置是否广播当前用户的鼠标轨迹给其他用户
     */
    setShowCursor(value: boolean): void

    /**
     * 重置白板位置
     * @param animate 是否通过动画过渡到目标位置
     */
    resetCamera(animate: boolean): void

    /**
     * 适配白板窗口至包含全部内容
     * @param animate 是否通过动画过渡到目标位置
     */
    fitToContent(animate: boolean): void

    /**
     * 适配白板窗口至包含背景图(通过addDoc或者setPageBackground添加的图片)
     * @param animate 是否通过动画过渡到目标位置
     */
    fitToDoc(animate: boolean): void

    /**
     * 设置当前白板容器对应的世界坐标系。由于容器宽高和设置的宽高可能不同，因此实际上会保证设置的世界坐标系完全显示在白板容器上，并且宽，或者高完全撑住容器。
     * 
     * @param bound 目标坐标位置
     * @param animate 是否通过动画过渡到目标位置
     */
    setCameraBound(bound: ICameraBound, animate: boolean): void

    /**
     * 返回当前白板容器对应的世界坐标系
     */
    getCameraBound(): {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    }

    /**
     * SDK 初始化后，是否已经经历过第一次视角调整。
     * 推荐如果要插入背景图片和容器一样大时，要等到第一次视角调整结束后
     * 
     * @example
     * 
     * ```js
     * sdk.joinRoom({})
     * .then(drawPlugin => {
     *   if (drawPlugin.isCameraReady()) {
     *     //SDK 初始视角已调整完毕
     *     setBackgroundImage(drawPlugin)
     *   } else {
     *     drawPlugin.on('event:appState:change', eventType => {
     *       if (eventType === 'cameraReady') { 
     *         setBackgroundImage(drawPlugin)
     *       }
     *     })
     *   }
     * })
     * 
     * function setBackgroundImage(drawPlugin) {
     *   const cameraBound = drawPlugin.getCameraBound()
     *   drawPlugin.setPageBackground({
     *     url: 'xxx',
     *     width: cameraBound.width,
     *     height: cameraBound.height
     *   })
     * }
     * ```
     */
    isCameraReady(): boolean

    /**
     * 该函数主要用于标注场景中，保持白板和被标注物的相对位置不变。
     * 
     * 假设标注物为一张图片，则该函数有以下限制：
     * 1. 标注物的固有宽高不会变化
     * 2. 标注物容器的大小、位置和白板的大小、位置始终保持一致
     * 3. 标注物显示出来的宽高比例和其固有宽高比例一致
     * 4. 标注物在水平、或者垂直方向上撑满容器，在另一个方向尺寸则小于等于容器尺寸
     * 5. 在未撑满容器的方向上，标注物应该居中放置
     * 
     * 在以上限制条件下，调用了此函数后，白板的位置将始终和标注物位置相对不变
     * @param opt 
     */
    lockCameraWithContent(opt: {
        /**
         * 标注物宽度
         */
        width: number,
        /**
         * 标注物高度
         */
        height: number
    }): void

    /**
     * 解除相机与标注物之间的对齐关系
     */
    unlockCameraWithContent(): void

    /**
     * 以当前白板视角中心为瞄点缩放
     */
    zoomIn(): void

    /**
     * 以当前白板视角中心为瞄点缩放
     */
    zoomOut(): void

    /**
     * 以当前白板视角中心为瞄点缩放。可以指定最终的缩放大小
     * @param scale 1表示缩放至100%
     * @param animate 是否通过动画过渡到目标位置
     */
    zoomTo(scale: number, animate: boolean): void

    /**
     * 撤销。若drawPlugin.getUndoCount()为0，则无法撤销
     */
    undo(): void

    /**
     * 重做。若drawPlugin.getRedoCount()为0，则无法重做
     */
    redo(): void

    /**
     * 清空画布。若drawPlugin.isClearAvailable()为false，则无法清空
     */
    clear(): void

    /**
     * 复制选中的元素。若drawPlugin.getSelectedIds()返回空数组，则无法复制
     */
    duplicate(): void

    /**
     * 添加页面。
     */
    addPage(opt: {
        /**
         * 若提供，则在insertAfter索引代表的页面后插入。若不提供，则插入在最后一页
         */
        insertAfter?: number,
        /**
         * 添加页面的自定义数据。开发者可以根据自定义数据进行页面检索或其他。
         */
        payload: any
    }): void

    /**
     * 跳转到指定页面
     * @param index 目标页面索引
     */
    gotoPage(index: number): void

    /**
     * 跳转至第一页
     */
    gotoFirstPage(): void

    /**
     * 跳转至上一页
     */
    gotoPrevPage(): void

    /**
     * 跳转至下一页
     */
    gotoNextPage(): void

    /**
     * 跳转至最后一页
     */
    gotoLastPage(): void

    /**
     * 删除指定页面
     * @param index 目标页面索引
     */
    deletePage(index: number): void

    /**
     * 跳转至指定页面的指定动画位置
     * 
     * 注意，参数pageIndex为页面在原始ppt中的索引
     * 
     * 如果当前Board不是动态ppt课件页、或者索引为'pageIndex'的页面已经被删除，则无法跳转
     * @param opt 
     */
    gotoAnim(opt: {
        /**
         * 原始ppt中的页面索引
         */
        pageIndex: number,
        animIndex: number,
        animState: 'start' | 'end'
    }): void

    /**
     * 跳转至下一动画。如果当前页动画播放完毕，则跳至下一页面。工具栏中对应的工具名称为nextAnim。
     * 
     * 该动作仅在当前Board使用动态ppt课件时才可以使用
     */
    nextAnim(): void

    /**
     * 跳转至上一动画。如果已经跳转到当前页第一个动画，则跳转至上一页面的最后一个动画结束状态。工具栏中对应的工具名称为prevAnim。
     * 
     * 该动作仅在当前Board使用动态ppt课件时才可以使用
     */
    prevAnim(): void

    /**
     * 添加静态课件。静态课件由多页图片组成。用户既可以传入多页静态图片作为参数，也可以传入云信静态课件转码结果作为参数
     * @example
     * 3.6.1以后（含3.6.1）使用template添加课件
     * ```js
     * addDoc({
     *  docName: '力学',
     *  params: {
     *      template: "https://nim.nosdn.127.net/408e9c59-cdc2-4979-b3e2-85d02d4f7ea3_1_{index}.jpg",
     *      width: 1920,
     *      height: 1080,
     *      offset: 1,
     *      pageCount: 2
     *  }
     * })
     * ```
     * 
     * @example
     * 3.6.0之前（含）addDoc时，opt.params应该为数组。
     * 如果高版本白板sdk需要和3.6.0及之前的版本互通，需要opt.params为数组才能够互通
     * 
     * ```js
     * addDoc({
     *  docName: '力学',
     *  params: [
     *      {
     *          url: "https://nim.nosdn.127.net/408e9c59-cdc2-4979-b3e2-85d02d4f7ea3_1_1.jpg",
     *          width: 1920,
     *          height: 1080,
     *      },
     *      {
     *          url: "https://nim.nosdn.127.net/408e9c59-cdc2-4979-b3e2-85d02d4f7ea3_1_2.jpg",
     *          width: 1920,
     *          height: 1080
     *      }
     * ])
     * ```
     * @returns 返回Board的boardName
     */
    addDoc(opt: {
        /**
         * Board的显示名
         */
        docName: string,
        /**
         * 静态课件的参数
         */ 
        params: IStaticDocParam | Array<IStaticDocParamDeprecated>
    }): string

    /**
     * 添加动态Board。云信动态Board只支持云信转码的动态课件结果
     * 
     * 要展示动态Board，请确保页面中载入了pptRenderer.js
     * @returns 返回Board的boardName。注意boardName为sdk内部随机生成的名字，boardName不等于传入的docName
     */
    addTransDoc(opt: {
        /**
         * Board显示名
         */
        docName: string,
        /**
         * Board总页面数，一般来说，该页面数应该和ppt课件的页面总数相等
         */
        pageCount: number
        /**
         * ppt的宽度
         */
        width: number
        /**
         * ppt的高度
         */
        height: number
        /**
         * ppt转码的resultUrl地址
         */
        url: string
    }): string

    /**
     * 添加多页空白Board
     * @param docName Board显示名称
     * @param pageCount Board页数
     * 
     * @example
     * ```
     * const boardName = drawPlugin.addBoard('力学', 2)
     * ```
     * @returns 返回Board的boardName。注意boardName为sdk内部随机生成的名字，boardName不等于传入的docName
     */
    addBoard(docName: string, pageCount: number): string

    /**
     * 跳转至指定Board。
     * @param boardName addDoc, addTransDoc, addBoard的返回值 
     */
    gotoBoard(boardName: string): void

    /**
     * 删除指定Board
     * @param boardName addDoc, addTransDoc, addBoard的返回值 
     */
    deleteBoard(boardName: string): void

    /**
     * 设置当前用户为主播。其他用户将与当前用户保持视角同步。
     */
    setSelfAsBroadcaster(): void

    /**
     * 停止视角同步
     */
    unsetSelfAsBroadcaster(): void

    /**
     * 当页面中存在主播时，可以在自由观看和跟随模式中切换。若处于自由模式，可以调用setSelfAsFollower切换回跟随模式
     */
    setSelfAsFollower(): void

    /**
     * 当页面中存在主播时，可以在自由观看和跟随模式中切换。若处于跟随模式，可以调用setSelfAsFreeObserver切换回自由模式
     */
    setSelfAsFreeObserver(): void

    /**
     * 旋转当前画布上面的元素。注意angle的范围应该为[0, Math.PI * 2]
     * 画布上面的元素可以使用{@link DrawPlugin.getPageElementInfos}获取
     * 
     * @example
     * 顺时针旋转当前画布上元素90度
     * ```
     * const eles = drawPlugin.getPageElementInfos().filter(ele => ele.type === 'image' && ele.visible)
     * if (eles.length > 0) {
     *      for (let ele of eles) {
     *           drawPlugin.rotateElement({id: ele.id, Math.PI/2})
     *      }
     *  }
     * ```
     */
    rotateElement(opt: {
        id: string,
        angle: number
    }): void

    /**
     * 设置画布上元素的可见性。
     * 
     * 如果不传入ids，或者ids为undefined，则会设置当前页面所有元素的可见性。
     * 
     * @example
     * 隐藏画布上所有的涂鸦操作('pen')
     * ```
     * const ids = drawPlugin.getPageElementInfos().filter(ele => ele.type === 'pen' && ele.visible)
     * if (ids.length > 0) {
     *      drawPlugin.setElementsVisibility({ids, visible: false})
     *  }
     * ```
     */
    setElementsVisibility(opt: {
        ids?: string[],
        visible: boolean
    }): void

    /**
     * 导出board内容为base64字符串
     * 
     * 导出过程分为: 
     * 1. 资源下载过程。在该过程中，会触发onResourceProgress回调
     * 2. 生成图片过程。在该过程中，会触发onImgProgress回调
     * 3. 生成图片完成时，会触发onComplete回调
     * 
     * 若生成过程中有异常，则会触发onError回调。
     * 
     * 注意, exportBoardAsStr尚不支持在移动端调用。且该过程时间可能较长，会造成页面少许卡顿。
     * 
     * @param opt 
     * @param callbacks 
     * 
     * @example
     * ```
     * drawPlugin.exportBoardAsStr(
     *      {
     *           content: 'fitToContent'
     *       }, 
     *       {
     *           onResourceProgress: (number) => {
     *               console.log('resource下载进度', number)
     *           },
     *           onImgProgress: (number) => {
     *               console.log('图片生成进度', number)
     *           },
     *           onComplete: (result) => {
     *               console.log('图片生成完毕')
     *               console.log(result)
     *           },
     *           onError: (err) => {
     *               console.error('error', err)
     *           }
     *       }
     *   )
     * ```
     * 
     * @example
     * ```
     * 下面是生成PDF的示例代码
     * 
     * //正在生成pdf过程中时，避免重复生成pdf
     * let isExportPdf = false
     * 
     * //点击按钮开始生成pdf
     * async function onIconClick() {
     *      if (isExportPdf) {
     *          console.log('正在导出pdf，当前请求忽略')
     *          return
     *      }
     * 
     *      WhiteBoardSDK.showToast({
     *         type: 'info',
     *         msg: '正在下载pdf依赖资源，请耐心等待',
     *         time: 10000
     *      })
     * 
     *      try {
     *          isExportPdf = true
     *          await exportPdf()
     *      } catch (err) {
     *          console.error('export pdf error', err)
     *      } finally {
     *          isExportPdf = false
     *      }
     *      WhiteBoardSDK.hideToast()
     * }
     *
     * async function exportPdf() {
     *      return new Promise((res, rej) => {
     *          drawPlugin.exportBoardAsStr(
     *          {
     *              content: 'fitToContent',
     *              //一定程度上压缩，否则可能pdf过大
     *              quality: 0.7,
     *              type: 'jpeg',
     *              //Board依赖的图片等资源的最大等待时间: 90s
     *              resWait: 90000
     *          }, {
     *              onResourceProgress: (number) => {
     *                  WhiteBoardSDK.showToast({
     *                      type: 'info',
     *                      msg: `正在下载资源: ${Math.ceil(number * 100)}%`,
     *                      time: 10000
     *                  })
     *              },
     *              onImgProgress: (number) => {
     *                  WhiteBoardSDK.showToast({
     *                      type: 'info',
     *                      msg: `正在生成pdf: ${Math.ceil(number * 100)}%`,
     *                      time: 10000
     *                  })
     *              },
     *              onComplete: (result) => {
     *                  console.log('on complete')
     *                  generatePdf(result)
     *                  res()
     *              },
     *              onError: (err) => {
     *                  rej()
     *              }
     *          }
     *      )
     *  })
     * }
     * 
     * 
     *  function generatePdf(res) {
     *      WhiteBoardSDK.hideToast()
     * 
     *      const orientation = res.maxW > res.maxH ? 'l' : 'p'
     *
     *      if (res.nullPages.length > 0) {
     *          console.log('导出失败的页面: ', res.nullPages.join(','))
     *      }
     *
     *      if (res.contents.length > 0) {
     *          //依赖于：https://www.npmjs.com/package/jspdf
     * 
     *          const jsPDF = new window.jspdf.jsPDF({
     *              orientation,
     *              unit: 'px',
     *              hotfixes: ["px_scaling"],
     *              compress: true,
     *              format: [res.maxW, res.maxH]
     *          })
     *
     *          //第一页
     *          jsPDF.addImage(
     *              res.contents[0],
     *              'JPEG',
     *              (res.maxW - res.sizes[0].w) / 2, (res.maxH - res.sizes[0].h) / 2,
     *              res.sizes[0].w, res.sizes[0].h,
     *              '',
     *              'FAST'
     *          )
     *
     *          for (let i = 1; i < res.contents.length; i++) {
     *              jsPDF.addPage({
     *                  orientation,
     *                  unit: 'px',
     *                  hotfixes: ["px_scaling"],
     *                  format: [res.maxW, res.maxH]
     *              })
     * 
     *              //第二页到最后一页
     *              jsPDF.addImage(
     *                  res.contents[i],
     *                  'JPEG',
     *                  (res.maxW - res.sizes[i].w) / 2,
     *                  (res.maxH - res.sizes[i].h) / 2,
     *                  res.sizes[i].w,
     *                  res.sizes[i].h,
     *                  '',
     *                  'FAST'
     *              )
     *          }
     * 
     *          jsPDF.save('whiteboard.pdf')
     *      }
     *  }
     * ```
     * 
     */
    exportBoardAsStr(opt: {
        type?: 'jpeg' | 'png',
        /**
         * 图片精度。有效范围为(0, 1]。只有当type为'jpeg'时有效
         */
        quality?: number,
        /**
         * clip导出当前页显示的内容。导出图片分辨率和容器大小一样
         * 
         * fitToDoc导出图片和页面中课件的宽高一样
         * 
         * fitToContent导出图片和页面中内容的最大宽高一样。如果内容较小，会设置最小宽高为容器宽高
         */
        content?: 'clip' | 'fitToDoc' | 'fitToContent',
         /**
         * 是否绘制选择框。默认为false，即不忽略（绘制）
         */
        omitSelection?: boolean
        /**
         * 导出图片时，是否包含自定义背景。默认为false
         */
        customBg?: boolean
        /**
         * board名称。若不提供，则默认为当前board
         */
        boardName?: string,
        /**
         * 导出board为图片前，会下载board依赖的资源。resWait指资源下载最长等待时间。默认值为90s。
         * 
         * 若超过resWait还没有下载下来全部依赖的资源，则会继续下一步直接渲染
         */
        resWait?: number
    }, callbacks: {
        /**
         * 调用成功时的回调函数
         */
        onComplete: (res: {
            /**
             * 每一页渲染结果的base64值
             */
            contents: Array<string>,
            /**
             * 每一页图片的尺寸
             */
            sizes: Array<{w: number, h: number}>,
            /**
             * 所有图片的最大宽度
             */
            maxW: number,
            /**
             * 所有图片的最大高度
             */
            maxH: number,
            /**
             * 导出失败的图片索引
             */
            nullPages: Array<number>
        }) => void
        /**
         * 资源加载过程中回调函数。注意，动态课件的资源加载过程不会触发该回调。
         */
        onResourceProgress?: (progress: number) => void
        /**
         * 生成每一页base64值的过程的回调函数
         */
        onImgProgress?: (progress: number) => void
        /**
         * 抛出异常时的回调函数
         */
        onError?: (err: any) => void
    }): void

    /**
     * 导出当前白板页面内容为图片。该函数会触发浏览器的下载事件
     * @example
     * 默认导出当前页面白板快照的png图片
     * ```
     * drawPlugin.exportAsImage()
     * ```
     * 
     * @example
     * 导出当前白板页面的全部内容（包括不在视角内的内容）。格式为jpeg, 精度为0.7
     * ```
     * drawPlugin.exportAsImage({
     *    type: 'jpeg',
     *    quality: 0.7,
     *    content: 'wholePage',
     *    omitSelection: true,
     *    customBg: true
     * })
     * ```
     */
    exportAsImage(opt?: {
        type?: 'jpeg' | 'png',
        /**
         * 图片精度。有效范围为(0, 1]。只有当type为'jpeg'时有效
         */
        quality?: number,
        /**
         * clip导出当前页显示的内容。导出图片分辨率和容器大小一样
         * 
         * fitToDoc导出图片和页面中课件的宽高一样
         * 
         * fitToContent导出图片和页面中内容的最大宽高一样。如果内容较小，会设置最小宽高为容器宽高
         */
        content?: 'clip' | 'fitToDoc' | 'fitToContent',
         /**
         * 是否绘制选择框。默认为false，即不忽略（绘制）
         */
        omitSelection?: boolean
        /**
         * 导出图片时，是否包含自定义背景。默认为false
         */
        customBg?: boolean
    }): void

    /**
     * 参数和{@link DrawPlugin.exportAsImage}一样
     * 
     * 返回当前页面的base64编码，及其宽高
     */
    exportAsBase64String(opt?: {
        type?: 'jpeg' | 'png',
        /**
         * 图片精度。有效范围为(0, 1]。只有当type为'jpeg'时有效
         */
        quality?: number,
        /**
         * clip导出当前页显示的内容。导出图片分辨率和容器大小一样
         * 
         * fitToDoc导出图片和页面中课件的宽高一样
         * 
         * fitToContent导出图片和页面中内容的最大宽高一样。如果内容较小，会设置最小宽高为容器宽高
         */
        content?: 'clip' | 'fitToDoc' | 'fitToContent',
        /**
         * 是否绘制选择框。默认为false，即不忽略（绘制）
         */
        omitSelection?: boolean
        /**
         * 导出图片时，是否包含自定义背景。默认为false
         */
         customBg?: boolean
    }): {
        /**
         * 生成图片的宽度
         */
        width: number,
        /**
         * 生成图片的高度
         */
        height: number,
        /**
         * 生成图片的base64编码
         */
        content: string
    } | null

    /**
     * 导入白板时的事件
     */
    on(eventName: 'event:importBoard', callback: (action: 'start' | 'finish') => void): void
    /**
     * 资源加载成功，或者多次重试后依旧加载失败时，会触发此回调
     * 
     * @example
     * ```
     * drawPlugin.on('event:resource:onload', (resource) => {
     *  console.log(`${resource.type}: ${resource.url} 加载${resource.loaded ? '成功' : '失败'}`)
     * })
     * ```
     */
    on(eventName: 'event:resource:onload', callback: (resourceMetadata: IResourceMetaData) => void): void
    /**
     * 注册回调监听颜色变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'styleUpdate') {
     *      console.log('default style change to', value)
     *  }
     * })
     * ```
     */
    on(eventName: 'event:appState:change', callback: (stateName: 'styleUpdate', style: IStyle) => void): void

    /**
     * 注册回调监听画笔缩放变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'zoomFactor') {
     *      console.log('scale change to', value)
     *  }
     * })
     * ```
     */
    on(eventName: 'event:appState:change', callback: (stateName: 'zoomFactor', scale: number) => void): void

    /**
     * 注册回调监听教具变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'currTool') {
     *      console.log('currTool change to', value)
     *  }
     * })
     * ```
     */
    on(eventName: 'event:appState:change', callback: (stateName: 'currTool', tool: string) => void): void

    /**
     * 注册回调监听是否可以清空的状态变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'clearAvailable') {
     *      console.log('is clearAvailable', value)
     *  }
     * })
     * ```
     */
    on(eventName: 'event:appState:change', callback: (stateName: 'clearAvailable', available: boolean) => void): void

    /**
     * 注册回调监听redo可用次数变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'redoCount') {
     *      console.log('redoCount', value)
     *  }
     * })
     * ```
     */
    on(eventName: 'event:appState:change', callback: (stateName: 'redoCount', count: number) => void): void

    /**
     * 注册回调监听undo可用次数变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'undoCount') {
     *      console.log('undoCount', value)
     *  }
     * })
     * ```
     */
    on(eventName: 'event:appState:change', callback: (stateName: 'undoCount', count: number) => void): void

    /**
     * 注册回调监听选中元素的变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, oldSelectedOpIds, currSelectedOpIds, nonMediaSelectedOpIds) => {
     *  if (stateName === 'selectChange') {
     *      console.log('过去选中元素', oldSelectedOpIds)
     *      console.log('将要选中元素', currSelectedOpIds)
     *      console.log('将要选中的非音视频元素', nonMediaSelectedOpIds)
     *  }
     * })
     * ```
     */
    on(eventName: 'event:appState:change', callback: (stateName: 'selectChange', oldSelectedOpIds: string[], currSelectedOpIds: string[], nonMediaSelectedOpIds: string[]) => void): void

    /**
     * 注册回调监听Board新增，删除，切换
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'board') {
     *      console.log('board infos', value)
     *  }
     * })
     * ```
     */
     on(eventName: 'event:appState:change', callback: (stateName: 'board', infos: IBoardInfos) => void): void

    /**
     * 注册回调监听页面新增，删除，切换
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'page') {
     *      console.log('page infos', value)
     *  }
     * })
     * ```
     */
     on(eventName: 'event:appState:change', callback: (stateName: 'page', infos: IPageInfos) => void): void

    /**
     * 注册回调监听视角状态的变化
     * @example
     * ```
     * drawPlugin.on('event:appState:change', (stateName, value) => {
     *  if (stateName === 'vision') {
     *      console.log('当前视角模式', value.mode)
     *      console.log('是否存在用户在广播', value.broadcaster !== undefined)
     *  }
     * })
     * ```
     */
     on(eventName: 'event:appState:change', callback: (stateName: 'vision', infos: {
        /**
         * broadcaster: 当前用户为主播，其他用户跟随当前用户视角
         * follower: 当前用户跟随主播视角
         * freeObserver：当前用户自由视角
         */
        mode: 'broadcaster' | 'follower' | 'freeObserver',
        /**
         * 主播名称。优先使用昵称(nickname), 若初始化时未设置nickname，则为主播uid
         */
        broadcasterName: string | undefined
        /**
         * 主播uid
         */
        broadcaster: string | undefined
     }) => void): void

     /**
      * 获取白板视频流。开发者可以使用函数的返回的视频流，通过rtc，或者其他的方式推出去。
      * 注意，每次调用时，都会关闭现有的track，并返回一个新的stream
      * 
      * @example
      * 获取白板视频流，并使用rtc推流
      * ```
      * const stream = drawPlugin.getStream()
      * tracks = stream.getVideoTracks()
      * rtc.localStream.open({
      *     type: 'screen',
      *     screenVideoSource: tracks[0]
      * })
      * ```
      * 
      * @example
      * 指定白板视频流的宽度。高度会随根据视频流宽度 * 白板的宽高比得到
      * ```
      * const stream = drawPlugin.getStream({width: 1000})
      * ```
      * 
      * @example
      * 视频流的宽度随着白板容器的宽度而变化。如果屏幕dpi为2，则下面推流的分辨率为容器宽度 * 2
      * ```
      * const stream = drawPlugin.getStream({keepDPI: true})
      * ```
      * 
      * @example
      * 如果推流时，希望分辨率不受dpi影响，则应该设置keepDPI为fals
      * ```
      * const stream = drawPlugin.getStream({keepDPI: false})
      * ```
      */
     getStream(opt?: {
        /**
         * 视频流宽度。高度根据容器宽高比自动计算
         * 
         * 若不指定，则视频分辨率随容器宽度变化
         */
        width?: number,
        /**
         * 默认为true
         * 
         * 如果设置了width，则该参数无效
         * 如果未设置width，参数为true时，视频流的大小为容器宽度 * DPI
         */
        keepDPI?: boolean
        /**
         * 白板推流的 fps。
         * 
         * 请参考该接口的frameRate参数：https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
         * 
         * 当该参数设置超过60时，实际采集为 60 fps。
         */
        frameRate?: number
    }): MediaStream

    /**
      * 更新现有的stream。如果当前不存在stream，则返回一个新的stream。
      * 如果存在stream，则直接更新现有stream的分辨率
      */
     updateStream(opt?: {
        /**
         * 视频流宽度。高度根据容器宽高比自动计算
         * 
         * 若不指定，则视频分辨率随容器宽度变化
         */
        width?: number,
        /**
         * 默认为true
         * 
         * 如果设置了width，则该参数无效
         * 如果未设置width，参数为true时，视频流的大小为容器宽度 * DPI
         */
        keepDPI?: boolean
    }): MediaStream

    /**
     * 关闭白板视频流。
     * 
     * 如果停止了白板直播，可以调用该函数销毁白板推流的相关对象，防止无谓的性能消耗。WhiteboardSDK.destroy时会自动调用该函数
     */
    stopStream(): void

    /**
     * 白板容器的宽高变化后，可以使用该函数刷新容器的显示。
     * 白板本身设置了mutationObserver处理容器变化。但是有时候该事件可能会失效。这时候，开发者可以主动更新容器的属性。
     */
    updateContainerAfterResize(): void

    /**
     * 将白板内容导出文件。导出后的文件，可以调用 {@link DrawPlugin.importBoards} 导入。
     * 
     * 这个函数的常用场景为，将当前课堂的白板内容保存，然后在下次课堂开始时，导入白板内容。
     * 
     * <h4> 注意事项 </h4>
     * 为了避免导入时默认白板名称冲突，默认白板导出时，名称被改为 whiteboard_${时间戳}。
     * 
     * <h4>关联函数</h4>
     * <ul>
     * <li>{@link DrawPlugin.importBoards}</li>
     * </ul>
     * 
     * @returns 
     * - summary: 导出 board 的概括。每个 board 的概括包含 board 的名称，显示名称，以及页面数； 
     * - content: 导出的内容。importBoards 的 url 对应的文件内容应该和 content 保持一致。
     */
    exportBoards(opt: {
        /**
         * 选择导出的 board。boardNames 可以使用 drawPlugin.getBoardInfos().boardNames 获取
         */
        boardNames: Array<string>, 
        /**
         * 导出时的文件名。如果不设置，则默认为 whiteboard.yxwb
         */
        fileName?: string
        /**
         * 是否下载文件。如果为true，则会触发浏览器的下载事件。默认为 false
         */
        download?: boolean
    }): {
        /**
         * 导出 board 的概括。每个 board 的概括包含 board 的名称，显示名称，以及页面数
         * 
         * 为了避免导入时默认白板名称冲突，默认白板导出时，名称被改为 whiteboard_${时间戳}。
         */
        summary: Array<{
            name: string,
            displayName: string
            pageCount: number
        }>,
        /**
         * 导出的内容。importBoards 的 url 对应的文件内容应该和 content 保持一致。
         */
        content: string
     } | null

    /**
     * 导入白板。
     * 
     * - 导入成功前，白板内不允许操作，收到其它端的数据后，也不会立即刷新白板内容。
     * - 导入过程中，默认在白板容器上方会显示进度提示。如果需要关闭提示，或者自定义提示UI，请设置:
     * 
     * ```js
     * drawPlugin.setAppConfig({
     *   showImportProgress: false
     * })
     * 
     * drawPlugin.on('event:importBoard', (state) => {
     *   if (state === 'start') {
     *      //自定义提示UI
     *   } else if (state === 'finish') {
     *      //自定义提示UI
     *   }
     * })
     * ```
     * 
     * <h4>关联函数</h4>
     * <ul>
     * <li>{@link DrawPlugin.exportBoards}</li>
     * </ul>
     */
    importBoards(opt: {
        /**
         * 导入的文件地址。该地址内容为 exportBoards 导出的文件
         */
        url: string, 
        /**
         * 可选参数。如果不填，默认导入 exportBoards 文件的所有内容。如果填写，则只导入指定的 board
         */
        boardNames?: Array<string>,
        /**
         * 可选参数。默认值为 false。如果为 true，则当前白板所有的内容都会被清空，并被导入的内容替换。如果为 false，则只添加新的 board，不会影响当前 board 内容
         */
        overwrite?: boolean
    }): void
}
