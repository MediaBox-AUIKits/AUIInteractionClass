/*
 * Copyright (c) 2021 NetEase, Inc.  All rights reserved.
 */

import { IContainerOption, IDocEntity, IMediaEntity, IPosition, IResourceEntity, IToolCollectionOption, IUnitOption } from "./types";

/**
 * 房间工具栏接口
 */
declare namespace ToolCollection {
    /**
     * 创建工具栏实例
     */
    function getInstance(option: IToolCollectionOption): ToolCollectionInstance;
}

export interface ToolCollectionInstance {
    /**
     * 重置整个工具栏。其参数格式和{@link ToolCollection.getInstance}中的`option.containerOptions`格式一样
     * 
     * @example
     * 下面是桌面端工具栏的默认配置
     * 
     * ```
     * [
     *    {
     *        position: 'left',
     *        items: [
     *            {
     *                tool: 'select',
     *                hint: '选择'
     *            },
     *            {
     *                tool: 'shapeSelect',
     *                hint: '选择图形'
     *            },
     *            {
     *                tool: 'text',
     *                hint: '文本'
     *            },
     *            {
     *                tool: 'laser',
     *                hint: '激光笔'
     *            },
     *            {
     *                tool: 'element-eraser',
     *                hint: '橡皮擦'
     *            },
     *            {
     *                tool: 'duplicate',
     *                hint: '复制'
     *            },
     *            {
     *                tool: 'clear',
     *                hint: '清空'
     *            },
     *            {
     *                tool: 'undo',
     *                hint: '撤销'
     *           },
     *           {
     *               tool: 'redo',
     *               hint: '重做'
     *           },
     *           {
     *               tool: 'pan',
     *               hint: '整体平移'
     *           },
     *           {
     *               tool: 'image',
     *               hint: '图片上传'
     *           },
     *           {
     *               tool: 'exportImage',
     *               hint: '导出图片'
     *           },
     *           {
     *               tool: 'uploadLog',
     *               hint: '上传日志'
     *           }
     *       ]
     *   },
     *   {
     *       position: 'bottomLeft',
     *       items: [
     *           {
     *               tool: 'fitToContentDoc'
     *           },
     *           {
     *               tool: 'zoomOut',
     *               hint: '缩小'
     *           },
     *           {
     *               tool: 'zoomLevel'
     *           },
     *           {
     *               tool: 'zoomIn',
     *               hint: '放大'
     *           },
     *           {
     *               tool: 'visionControl',
     *               hint: '视角同步'
     *           },
     *           {
     *               tool: 'visionLock',
     *               hint: '视角模式切换'
     *           }
     *       ]
     *   },
     *   {
     *       position: 'bottomRight',
     *       items: [
     *           {
     *               tool: 'firstPage',
     *               hint: '第一页'
     *           },
     *           {
     *               tool: 'prevPage',
     *               hint: '上一页'
     *           },
     *           {
     *               tool: 'pageInfo'
     *           },
     *           {
     *               tool: 'nextPage',
     *               hint: '下一页'
     *           },
     *           {
     *               tool: 'lastPage',
     *               hint: '最后一页'
     *           },
     *           {
     *               tool: 'preview',
     *               hint: '预览',
     *               previewSliderPosition: 'right'                    
     *           }
     *       ]
     *   },
     *   {
     *       position: 'topRight',
     *       items: [
     *           {
     *               tool: 'docSelect'
     *           },
     *           {
     *               tool: 'docUpload',
     *               hint: '上传文档',
     *               supportPptToH5: true,
     *               supportDocToPic: true
     *               supportUploadMedia: true,
     *               supportTransMedia: true
     *           }
     *       ]
     *   }
     *]
     * ```
     * 
     * @example
     * 下面为移动端的默认工具栏配置
     * ```
     * [
     *     {
     *          position: 'bottomRight',
     *          items: [
     *                 {
     *                     tool: 'select',
     *                     hint: '选择'
     *                 },
     *                 {
     *                     tool: 'shapeSelect',
     *                     hint: '选择图形'
     *                 }
     *                 {
     *                     tool: 'multiInOne',
     *                     hint: '更多',
     *                     subItems: [
     *                         {
     *                             tool: 'element-eraser'
     *                         },
     *                         {
     *                             tool: 'clear'
     *                         },
     *                         {
     *                             tool: 'undo'
     *                         },
     *                         {
     *                             tool: 'redo'
     *                         },
     *                         {
     *                             tool: 'image'
     *                         },
     *                         {
     *                             tool: 'exportImage'
     *                         }
     *                     ]
     *                 }
     *             ]
     *         },
     *         {
     *             position: 'topRight',
     *             items: [
     *                 {
     *                     tool: 'multiInOne',
     *                     hint: '更多',
     *                     subItems: [
     *                         {
     *                             tool: 'docUpload',
     *                             supportPptToH5: true,
     *                             supportDocToPic: true,
     *                             supportUploadMedia: true,
     *                             supportTransMedia: true
     *                         },
     *                         {
     *                             tool: 'fitToContent'
     *                         },
     *                         {
     *                             tool: 'fitToDoc'
     *                         },
     *                         {
     *                             tool: 'pan'
     *                         },
     *                         {
     *                             tool: 'zoomIn'
     *                         },
     *                         {
     *                             tool: 'zoomOut'
     *                         },
     *                         {
     *                             tool: 'visionControl'
     *                         },
     *                         {
     *                             tool: 'visionLock'
     *                         },
     *                         ...uploadLogItem
     *                     ]
     *                 },
     *                 {
     *                     tool: 'zoomLevel',
     *                     size: 2
     *                 }
     *            ]
     *         },
     *         {
     *             position: 'topLeft',
     *             items: [
     *                 {
     *                     tool: 'pageBoardInfo'
     *                 },
     *                 {
     *                     tool: 'preview',
     *                     hint: '预览',
     *                     previewSliderPosition: 'right' 
     *                 }
     *             ]
     *         }
     *  ]
     * ```
     */
    setContainerOptions(option: Array<IContainerOption>): void,
    /**
     * 重置给定位置(option.position)的工具栏。
     * 
     * @example
     * 添加动态文档后，重置右下角的工具栏
     * 
     * ```
     * addOrSetContainer({
     *  position: 'bottomRight',
     *  items: [
     *    {
     *        tool: 'prevPage',
     *        hint: '上一页'
     *    },
     *    {
     *        tool: 'prevAnim',
     *        hint: '上一步'
     *    },
     *    {
     *        tool: 'pageInfo'
     *    },
     *    {
     *        tool: 'nextAnim',
     *        hint: '下一步'
     *    },
     *    {
     *        tool: 'nextPage',
     *        hint: '下一页'
     *    },
     *    {
     *        tool: 'preview',
     *        hint: '预览',
     *        previewSliderPosition: 'right'
     *    }
     *  ]
     * })
     * ```
     * 
     */
    addOrSetContainer(option: IContainerOption): void,
    /**
     * 显示工具栏
     */
    show(): void,
    /**
     * 隐藏工具栏
     */
    hide(): void,
    /**
     * 设置工具栏中，局部组件的可见性。可以控制任一位置工具栏是否可见，以及该位置工具栏内部单一图标是否可见。
     * 
     * @param opt - 设置哪些元素可见。注意position的取值为: {@link IPosition}
     *
     * @example
     * 左侧工具栏仅保留平移(pan)图标
     * ```
     * setVisibility({
     *   left: {
     *      visible: false,
     *      exclude: ['pan']
     *   }
     * })
     * ```
     * 
     * @example
     * 左侧工具栏隐藏视频图标
     * ```
     * setVisibility({
     *   left: {
     *      visible: true,
     *      exclude: ['video']
     *   }
     * })
     * ```
     */
    setVisibility(opt: {
        [position: string]: {
            /**
             * 设置某一位置工具栏是否可见
             */
            visible: boolean,
            /**
             * 如果visible为true，则exclude内图标不可见
             * 如果visible为fales，则exclude内图标可见
             */
            exclude?: Array<string>
        }
    }): void,
    /**
     * 添加工具栏图标。如果图标已存在，则更新已有图标
     * 
     * @example
     * 在左侧工具栏的undo图标前面，添加video图标
     * ```
     * addOrSetTool({
     *  position: 'left',
     *  insertAfterTool: 'video'
     *  item: {
     *    tool: 'video',
     *    hint: '上传视频'
     *  }
     * })
     * ```
     */
    addOrSetTool(opt: {
        /**
         * 添加按钮于位于position的工具栏中
         */
        position: IPosition,
        /**
         * 将按钮添加到insertAfterTool后面
         * 如果未提供，则默认添加到最后一个
         */
        insertAfterTool?: string,
        /**
         * 要添加的工具栏按钮配置
         */
        item: IUnitOption
    }): void,
    /**
     * 移除工具栏图标。如果未设置position，则会寻找所有位置名字匹配的工具栏图标
     * 
     * @example
     * 移除所有位置的视频图标
     * 
     * ```
     * removeTool({
     *  name: 'video'
     * })
     * ```
     * 
     * @example
     * 移除左侧工具栏中的视频图标
     * 
     * ```
     * removeTool({
     *  name: 'video'
     *  position: 'left'
     * })
     * ```
     */
    removeTool(opt: {
        /**
         * 在位于position的工具栏中移除按钮。如果未提供，则在所有位置的工具栏中移除按钮
         */
        position?: IPosition,
        /**
         * 被移除的按钮名称
         */
        name: string
    }): void
    /**
     * 在图形集合(shapeSelect)，或者收纳盒(multiInOne)中添加子图标
     * 
     * 若position未指定，则会寻找所有位置名字匹配baseTool的图标集合
     * 
     * @example
     * 在左侧图形集合中添加自定义的triangle图标
     * ```
     * addOrSetSubItem({
     *  position: 'left',
     *  baseTool: 'shapeSelect',
     *  insertAfterTool: 'ellipse-fill',
     *  subItem: {
     *      tool: 'triangle',
     *      hint: '等腰三角形',
     *      backgroundImage: 'url_of_triangle_icon_image'
     *  }
     * })
     * ```
     */
    addOrSetSubItem(opt: {
        /**
         * 添加子按钮于位于position的工具栏中
         */
        position?: IPosition,
        /**
         * 选择图形集合，或者收纳盒作为目标按钮
         */
        baseTool: 'shapeSelect' | 'multiInOne',
        /**
         * 将子按钮添加到insertAfterTool之后，如果未提供，则添加到最后一个
         */
        insertAfterTool?: string,
        /**
         * 被添加的子按钮
         */
        subItem: IUnitOption
    }): void
    /**
     * 移除图形集合(shapeSelect), 或者收纳盒(multiInOne)的子图标
     * 
     * 若position未指定，则会寻找所有位置名字匹配baseTool的图标集合
     * 
     * @example
     * 移除图形集合中的三角形图标
     * 
     * ```
     * removeSubItem({
     *  baseTool: 'shapeSelect',
     *  subItemName: 'triangle'
     * })
     * ```
     */
    removeSubItem(opt: {
        /**
         * 在位于position的工具栏中移除按钮。如果未提供，则在所有位置的工具栏中移除按钮
         */
        position?: IPosition,
        /**
         * 选择图形集合，或者收纳盒作为目标按钮
         */
        baseTool: 'shapeSelect' | 'multiInOne',
        /**
         * 被移除的子按钮名称
         */
        subItemName: string
    }): void
    /**
     * 添加多个转码文件至文档弹窗中。多次调用时，只有最后一次调用会生效
     * 
     * @example
     * 添加两个文档，一个2页静态文档，一个5页动态文档
     * ```
     * setDefaultDocList([
     *  {
     *      docId: '12222',
     *      fileType: 'pdf',
     *      name: '示例pdf',
     *      showDelete: true,
     *      params: {
     *          template: "https://nim.nosdn.127.net/408e9c59-cdc2-4979-b3e2-85d02d4f7ea3_1_{index}.jpg",
     *          width: 1920,
     *          height: 1080,
     *          offset: 1,
     *          pageCount: 2
     *      }
     *  },
     *  {
     *      docId: '23222',
     *      fileType: 'ppt',
     *      name: '宠物店',
     *      showDelete: true,
     *      params: {
     *          url: 'https://wb.vod.126.net/courseware/doc/20787511/2446/IKc6u1XI/index.json',
     *          width: 1280,
     *          height: 720,
     *          pageCount: 5
     *      }
     *  }
     * ])
     * ```
     */
    setDefaultDocList(docList: Array<IDocEntity>): void
    /**
     * 添加一个转码文件至文档弹窗中。
     * 
     * 如果新添加的docId已存在，则它会覆盖已有转码文件内容
     * @example
     * ```
     * addDoc(
     *  {
     *      docId: '12222',
     *      fileType: 'pdf',
     *      name: '示例pdf',
     *      showDelete: true,
     *      params: {
     *          template: "https://nim.nosdn.127.net/408e9c59-cdc2-4979-b3e2-85d02d4f7ea3_1_{index}.jpg",
     *          width: 1920,
     *          height: 1080,
     *          offset: 1,
     *          pageCount: 2
     *      }
     *  }
     * )
     * ```
     */
    addDoc(doc: IDocEntity): void,
    /**
     * 删除转码弹窗中的转码文件
     * 
     * @example
     * 删除上面示例中的静态转码文件
     * ```
     * deleteDoc('12222')
     * ```
     */
    deleteDoc(docId: string): void,
    /**
     * 工具栏内转码成功后，以及用户通过{@link ToolCollectionInstance.setDefaultDocList}, {@link ToolCollectionInstance.addDoc}添加文档时，会触发此函数回调。
     * 
     * 用户可以使用该回调函数，在转码成功后，将转码结果保存在用户的应用服务器中。
     * 
     * @example
     * ```
     * toolCollection.on('docAdd', (newDocs) => {
     *  for (let doc of docList) {
     *      pushToServer(uid, doc)
     *  }
     * })
     * ```
     * 
     * @example
     * ```
     * //监听回调，直接将该用户弹窗内所有文档发送到服务器中（包括已经转码成功，以及上传成功，但是正在转码的文档）
     * toolCollection.on('docAdd', (_, allDocs) => {
     *  writeToServer(allDocs)
     * })
     * 
     * //初始化时，可以使用服务器中的数据还原
     * toolCollection.setDefaultDocList(allDocs)
     * ```
     */
    on(event: 'docAdd', callback: (newDocs: Array<IDocEntity | IMediaEntity>, allDocs: Array<IResourceEntity>) => void): void,
    /**
     * 文档弹窗内转码文件被删除时，会触发此回调。
     * 
     * 用户可以使用该回调函数，在文件被删除后，删除应用服务器中相关数据
     * 
     * @example
     * ```
     * toolCollection.on('docDelete', (docList) => {
     *  for (let doc of docList) {
     *      removeFromServer(uid, doc)
     *  }
     * })
     * ```
     * 
     * @example
     * ```
     * //监听回调，直接将该用户弹窗内所有文档发送到服务器中（包括已经转码成功，以及上传成功，但是正在转码的文档）
     * toolCollection.on('docDelete', (_, allDocs) => {
     *  writeToServer(allDocs)
     * })
     * 
     * //初始化时，可以使用服务器中的数据还原
     * toolCollection.setDefaultDocList(allDocs)
     * ```
     */
    on(event: 'docDelete', callback: (docList: Array<IDocEntity>, allDocs: Array<IResourceEntity>) => void): void,
    /**
     * @example
     * 下面示例如何使用自定义按钮，将画布上的选中的图片进行旋转
     * 注意，下面的示例需要用户先添加自定义按钮。自定义按钮名字格式为`custom-[name]`
     * ```
     * {
     *   tool: 'custom-rotate-img',
     *   hint: '旋转图片',
     *   backgroundImage: 'url_of_icon'
     * }
     * 
     * toolCollection.on('iconClick', (toolName) => {
     *     if (toolName === 'custom-rotate-img') {
     *          const eles = drawPlugin.getPageElementInfos().filter(ele => ele.type === 'image' && ele.visible)
     *          const selectedIds = drawPlugin.getSelectedIds()
     *          if (eles.length > 0) {
     *              for (let ele of eles) {
     *                  if (selectedIds.includes(ele.id)) {
     *                      drawPlugin.rotateElement({id: ele.id, angle})
     *                   }
     *              }
     *          }   
     *     }
     * })
     * ```
     */
    on(event: 'iconClick', callback: (toolName: string) => void): void
    /**
     * @example
     * 比如点击自定义状态按钮切换编辑状态。默认可以编辑，点击后可以切换是否可以编辑
     * 注意，下面的示例需要用户先添加自定义状态按钮。自定义状态按钮名字格式为`custom-state-[name]`
     * ```
     * {
     *  tool: 'custom-state-toggle-editable',
     *  hint: '切换编辑',
     *  clickCb: (currState) => {
     *    if (currState === 'editable') return 'non-editable'
     *    else return 'editable'
     *  },
     *  defaultState: 'editable',
     *  backgroundImageByState: {
     *    'editable': 'url_of_editable_state_icon',
     *    'non_editable': 'url_of_non_editable_state_icon'
     *  }
     * }
     * 
     * toolCollection.on('iconClick', (toolName, opt) => {
     *  if (toolName === 'custom-state-toggle-editable') {
     *      if (opt.newState === 'editable') {
     *          drawPlugin.enableDraw(true)
     *      } else {
     *          drawPlugin.enableDraw(false)
     *      }
     *  }
     * })
     * ```
     */
    on(event: 'iconClick', callback: (toolName: string, opt: {
        /**
         * 点击前的按钮状态
         */
        state: string,
        /**
         * 点击后的按钮状态
         */
        newState: string
    }) => void): void

    /**
     * 注销工具栏回调函数
     * 
     * @example
     * ```
     * const editableClickFn = (toolName, opt) => {
     *  if (toolName === 'custom-state-toggle-editable') {
     *      if (opt.newState === 'editable') {
     *          drawPlugin.enableDraw(true)
     *      } else {
     *          drawPlugin.enableDraw(false)
     *      }
     *  }
     * }
     * 
     * toolCollection.on('iconClick', editableClickFn)
     * 
     * //After some time...
     * toolCollection.off('iconClick', editableClickFn)
     * ```
     */
    off(event: 'docAdd' | 'docDelete' | 'iconClick', callback: (...args: any[]) => void): void
}




/**
 * 撤销上一步
 */
export type IUndoTool = {
    tool: 'undo'
    hint: '撤销',
    backgroundImage: 'image_url'
}


/**
 * 重做上一步
 */
export type IRedoTool = {
    tool: 'redo'
    hint: '重做'
    backgroundImage: 'image_url'
}

/**
 * 清空当前白板页的全部内容
 */
export type IClearTool = {
    tool: 'clear'
    hint: '清空'
    backgroundImage: 'image_url'
}

/**
 * 复制当前选中的元素
 */
 export type IDuplicateTool = {
    tool: 'duplicate'
    hint: '复制'
    backgroundImage: 'image_url'
}

/**
 * 重置白板缩放及位置
 */
 export type IResetTool = {
    tool: 'reset'
    hint: '重置'
    backgroundImage: 'image_url'
}

/**
 * 适配内容以及文档，注意该工具栏未开放hint设置
 */
export type IFitToContentDocTool = {
    tool: 'fitToContentDoc'
    backgroundImage: 'image_url'
}

/**
 * 适配内容
 */
export type IFitToContentTool = {
    tool: 'fitToContent'
    hint: '适配内容'
    backgroundImage: 'image_url'
}

/**
 * 适配文档
 */
 export type IFitToDocTool = {
    tool: 'fitToDoc'
    hint: '适配文档'
    backgroundImage: 'image_url'
}

/**
 * 放大
 */
 export type IZoomInTool = {
    tool: 'zoomIn'
    hint: '放大'
    backgroundImage: 'image_url'
}

/**
 * 放大
 */
export type IZoomOutTool = {
    tool: 'zoomOut'
    hint: '缩小'
    backgroundImage: 'image_url'
}

/**
 * 显示当前的缩放比例
 */
 export type IZoomLevelTool = {
    tool: 'zoomLevel'
}

/**
 * 跳到第一页
 */
export type IFirstPageTool = {
    tool: 'firstPage'
    hint: '第一页'
    backgroundImage: 'image_url'
}

/**
 * 跳到最后一页
 */
export type ILastPageTool = {
    tool: 'lastPage'
    hint: '最后一页'
    backgroundImage: 'image_url'
}

/**
 * 跳到最后一页
 */
 export type IPrevPageTool = {
    tool: 'prevPage'
    hint: '上一页'
    backgroundImage: 'image_url'
}

/**
 * 跳到最后一页
 */
 export type INextPageTool = {
    tool: 'nextPage'
    hint: '下一页'
    backgroundImage: 'image_url'
}

/**
 * 显示当前的页码信息
 */
 export type IPageInfoTool = {
    tool: 'pageInfo'
}

/**
 * 预览图
 */
export type IPreviewTool = {
    tool: 'preview'
    hint: '预览图'
    backgroundImage: 'image_url',
    previewSlidePoisition: 'left' | 'right'   //从左侧还是右侧滑出弹窗
}

/**
 * 图片上传加载按钮
 */
export type IImageTool = {
    tool: 'image'
    hint: '上传图片'
    backgroundImage: 'image_url'
}

/**
 * 视频上传加载按钮
 */
 export type IVideoTool = {
    tool: 'video'
    hint: '上传视频'
    backgroundImage: 'image_url'
}

/**
 * 音频上传加载按钮
 */
 export type IAudioTool = {
    tool: 'audio'
    hint: '上传音频'
    backgroundImage: 'image_url'
}

/**
 * 文档弹窗按钮
 */
 export type IDocUploadTool = {
    tool: 'docUpload'
    hint: '文档上传'
    backgroundImage: 'image_url'
    supportPptToH5: true
    supportDocToPic: true
    supportUploadMedia: true
    supportTransMedia: true
}

/**
 * 文档切换下拉框
 */
export type IDocSelectTool = {
    tool: 'docSelect'
}

/**
 * 同时显示当前页码和文档信息。目前用在了移动端的默认工具栏左上角
 */
 export type IPageBoardInfoTool = {
    tool: 'pageBoardInfo'
}

/**
 * 成为主播/取消成为主播
 */
export type IVisionControlTool = {
    tool: 'visionControl'
    hint: '视角同步'
    backgroundImage: 'image_url'
}

/**
 * 跟随者或者自由视角
 */
export type IVisionLockTool = {
    tool: 'visionLock'
    hint: '视角模式切换'
    backgroundImage: 'image_url'
}

/**
 * 导出图片
 */
export type IExportImageTool = {
    tool: 'exportImage',
    hint: '导出图片',
    backgroundImage: 'image_url'
}

/**
 * 收纳工具。点击可以展示subItems中的按钮
 */
export type IMultiInOneTool = {
    tool: 'multiInOne',
    hint: '更多',
    /**
     * 二级菜单一行显示多少个元素。默认为4
     */
    itemPerRow: 4,
    /**
     * subItems的配置规则和containerOptions中容器内items配置规则一样
     */
    subItems: [
        {
            tool: 'element-eraser'
        },
        {
            tool: 'clear'
        },
        {
            tool: 'undo'
        },
        {
            tool: 'redo'
        },
        {
            tool: 'image'
        },
        {
            tool: 'exportImage'
        }
    ]
}

/**
 * 上传日志
 */
 export type IUploadLogTool = {
    tool: 'uploadLog',
    hint: '上传日志',
    backgroundImage: 'image_url'
}

/**
 * 下一步动画。只能够用于操作动态ppt
 */
export type INextAnimTool = {
    tool: 'nextAnim',
    hint: '下一步',
    backgroundImage: 'image_url'
}


/**
 * 上一步动画。只能够用于操作动态ppt
 */
export type IPrevAnimTool = {
    tool: 'prevAnim',
    hint: '上一步',
    backgroundImage: 'image_url'
}

/**
 * 相对网格点
 */
 export type IBgGridDotWTool = {
    tool: 'bgGridDotW',
    hint: '相对网格点',
    backgroundImage: 'image_url'
}

/**
 * 相对网格线
 */
 export type IBgGridLineWTool = {
    tool: 'bgGridLineW',
    hint: '相对网格线',
    backgroundImage: 'image_url'
}

/**
 * 绝对网格线
 */
 export type IBgGridLineCTool = {
    tool: 'bgGridLineC',
    hint: '绝对网格线',
    backgroundImage: 'image_url'
}

export default ToolCollection