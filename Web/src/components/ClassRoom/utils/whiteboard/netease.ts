// 网易云信白板
import { loadJS } from '../common';
import { NeteaseSDKVersion } from '../../constants';
const jsUrls = [
  `${PUBLIC_PATH}script/WhiteBoardSDK_v${NeteaseSDKVersion}.js`,
  `${PUBLIC_PATH}script/ToolCollection_v${NeteaseSDKVersion}.js`,
  `${PUBLIC_PATH}script/pptRenderer_v${NeteaseSDKVersion}.js`,
];

interface InitOptions {
  container: HTMLElement;
  appKey: string;
  uid: number;
  nickname: string;
  getAuthInfo: () => Promise<{
    nonce: string;
    checksum: string;
    curTime: number;
  }>;
}

interface JoinRoomParams {
  channel: string;
  ondisconnected: (err: any) => void;
  onconnected: () => void;
  toolContainer: HTMLElement;
}

interface ToolVisibility {
  visible: boolean;
  exclude?: Array<string>;
}

class NetEase {
  wbIns?: typeof WhiteBoardSDKInstance;
  drawPlugin?: typeof DrawPlugin;
  toolCollection?: typeof ToolCollectionInstance;
  joinRoomParams?: JoinRoomParams;
  needRejoin: boolean = false;
  rejoinTimer?: number;
  // 目前是否是动态文档
  hasTransDoc: boolean = false;
  toolVisibility: Record<string, ToolVisibility> = {};

  constructor() {
    //
  }

  private loadJS() {
    const arr = jsUrls.map(url => loadJS(url));
    return Promise.all(arr);
  }

  async init(options: InitOptions) {
    await this.loadJS();
    const wbIns = WhiteBoardSDK.getInstance({
      ...(options || {}),
      platform: 'web',
      record: false, //是否开启录制
    });
    this.wbIns = wbIns;
    return wbIns;
  }

  destroy() {
    if (!this.wbIns) {
      return;
    }
    this.clearRejoinTimer();
    this.joinRoomParams = undefined;
    this.needRejoin = false;

    this.wbIns.destroy();
    this.wbIns = undefined;
    WhiteBoardSDK.hideToast();
  }

  joinRoom(params: JoinRoomParams) {
    this.joinRoomParams = params;

    if (!this.wbIns) {
      return Promise.reject({
        code: -1,
        msg: 'please init first',
      });
    }

    return this.doJoinRoom(params);
  }

  private doJoinRoom(params: JoinRoomParams, isRejoin = false) {
    const { channel, toolContainer, ondisconnected, onconnected } = params;

    return new Promise<void>((resolve, reject) => {
      this.wbIns
        ?.joinRoom(
          {
            channel,
          },
          {
            ondisconnected: (err: any) => {
              if (err && err.code === 200) {
                // 手动 destroy 时返回 200，不需要 rejoin
                ondisconnected(err);
                return;
              }
              // 异常断联后需要重新建联
              this.needRejoin = true;
              this.rejoin();
              ondisconnected(err);
            },
            onconnected: () => {
              this.needRejoin = false;
              this.clearRejoinTimer();
              onconnected();
            },
          }
        )
        .then((drawPlugin: typeof DrawPlugin) => {
          if (isRejoin) {
            return;
          }

          this.drawPlugin = drawPlugin;
          this.initDrawPlugin(toolContainer);

          resolve();
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }

  public initDrawPlugin(toolContainer: HTMLElement) {
    if (!this.drawPlugin) {
      return;
    }
    const drawPlugin = this.drawPlugin;
    // 设置精度
    drawPlugin.setAppConfig({
      defaultBoardName: '白板',
    });
    // 默认禁止编辑
    drawPlugin.enableDraw(false);
    // 设置画笔颜色
    drawPlugin.setColor('#1597FF');

    drawPlugin.on('event:appState:change', (name: string, infos) => {
      if (name !== 'board') {
        return;
      }
      const items = [
        {
          tool: 'firstPage',
          hint: '第一页',
        },
        {
          tool: 'prevPage',
          hint: '上一页',
        },
        {
          tool: 'pageInfo',
        },
        {
          tool: 'nextPage',
          hint: '下一页',
        },
        {
          tool: 'lastPage',
          hint: '最后一页',
        },
        {
          tool: 'preview',
          hint: '预览',
          previewSliderPosition: 'right',
        },
      ];
      if (!this.hasTransDoc && drawPlugin.hasTransDoc()) {
        // 动态文档时增加上、下一步
        this.hasTransDoc = true;
        items.splice(3, 0, {
          tool: 'nextAnim',
          hint: '下一步',
        });
        items.splice(2, 0, {
          tool: 'prevAnim',
          hint: '上一步',
        });
        toolCollection.addOrSetContainer({
          position: 'bottomRight',
          items,
        });
      } else if (this.hasTransDoc && !drawPlugin.hasTransDoc()) {
        this.hasTransDoc = false;
        toolCollection.addOrSetContainer({
          position: 'bottomRight',
          items,
        });
      }
    });

    // 初始化工具栏
    const toolCollection: typeof ToolCollectionInstance =
      ToolCollection.getInstance({
        /**
         * 工具栏容器。应该和白板容器一致
         *
         * 注意工具栏内子元素位置为绝对定位。因此，工具栏外的容器应该设置定位为relative, absolute, 或者fixed。
         * 这样，工具栏才能够正确的显示在容器内部
         */
        container: toolContainer,
        handler: drawPlugin,
        options: {
          platform: 'web',
        },
      });
    toolCollection.addOrSetTool({
      position: 'left',
      insertAfterTool: 'pan',
      item: {
        tool: 'uploadCenter',
        hint: '上传文档',
        supportPptToH5: true,
        supportDocToPic: true,
        supportUploadMedia: false,
        supportTransMedia: false,
      },
    });
    toolCollection.removeTool({ name: 'image' });
    toolCollection.removeTool({ name: 'uploadLog' });

    toolCollection.hide();
    this.toolCollection = toolCollection;
  }

  /**
   * 开启或禁用工具栏
   * @param {boolean} bool
   */
  public toggleToolCollection(bool: boolean) {
    this.drawPlugin?.enableDraw(bool);
    // 控制所有工具栏的可见性
    if (bool) {
      this.toolCollection?.show();
    } else {
      this.toolCollection?.hide();
    }
  }

  // 开启或禁用翻页器功能（对应地控制右下角翻页器工具栏）
  public togglePageTurner(bool: boolean) {
    const opt = {
      bottomRight: {
        visible: bool,
      },
    };
    this.toolVisibility = { ...this.toolVisibility, ...opt };
    this.toolCollection?.setVisibility(this.toolVisibility);
  }

  private clearRejoinTimer() {
    if (this.rejoinTimer !== undefined) {
      clearTimeout(this.rejoinTimer);
      this.rejoinTimer = undefined;
    }
  }

  private rejoin() {
    if (!this.wbIns) {
      return;
    }
    this.clearRejoinTimer();
    // 5 秒后尝试重新建联
    this.rejoinTimer = window.setTimeout(() => {
      if (!this.joinRoomParams || !this.needRejoin) {
        return;
      }

      this.doJoinRoom(this.joinRoomParams)
        .then(() => {
          console.log('重新建联成功！');
        })
        .catch(() => {
          this.rejoin();
        });
    }, 5000);
  }

  getStream(params: any) {
    return this.drawPlugin?.getStream(params);
  }

  setDefaultDocList(list: any[]) {
    this.toolCollection?.setDefaultDocList(list);
  }

  openUploadModal() {
    const el = document.querySelector('#yx-tc-uploadCenter') as HTMLDivElement;
    el?.click();
  }

  // 切换至指定白板
  switchToBoard(borderName: string) {
    this.drawPlugin?.gotoBoard(borderName);
  }

  // 添加白板
  addBoard(displayName = 'whiteboard') {
    this.drawPlugin?.addBoard(displayName, 1);
  }

  // 获取当前房间的Board结构
  getBoardInfos() {
    return this.drawPlugin?.getBoardInfos();
  }

  updateContainerAfterResize() {
    this.drawPlugin?.updateContainerAfterResize();
  }

  // 动态文档时执行上一步，静态文档时执行上一页
  prevPageOrAnim() {
    if (this.hasTransDoc) {
      this.drawPlugin?.prevAnim();
    } else {
      this.drawPlugin?.gotoPrevPage();
    }
  }

  // 动态文档时执行下一步，静态文档时执行下一页
  nextPageOrAnim() {
    if (this.hasTransDoc) {
      this.drawPlugin?.nextAnim();
    } else {
      this.drawPlugin?.gotoNextPage();
    }
  }
}

export default NetEase;
