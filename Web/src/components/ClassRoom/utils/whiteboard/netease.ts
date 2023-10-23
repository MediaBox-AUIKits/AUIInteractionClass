// 网易云信白板
import { loadJS } from '../common';
import { NeteaseSDKVersion } from '../../constances';
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

class NetEase {
  wbIns?: typeof WhiteBoardSDKInstance;
  drawPlugin?: typeof DrawPlugin;
  toolCollection?: typeof ToolCollectionInstance;
  joinRoomParams?: JoinRoomParams;
  needRejoin: boolean = false;
  rejoinTimer?: NodeJS.Timer;

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
      record: true, //是否开启录制
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
          // 设置精度
          drawPlugin.setAppConfig({
            defaultBoardName: '白板',
          });
          // 允许编辑
          drawPlugin.enableDraw(true);
          // 设置画笔颜色
          drawPlugin.setColor('#1597FF');

          let hasTransDoc = false;
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
            if (!hasTransDoc && drawPlugin.hasTransDoc()) {
              // 动态文档时增加上、下一步
              hasTransDoc = true;
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
            } else if (hasTransDoc && !drawPlugin.hasTransDoc()) {
              hasTransDoc = false;
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
          // 显示工具栏
          toolCollection.show();
          this.toolCollection = toolCollection;

          resolve();
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }

  private clearRejoinTimer() {
    if (this.rejoinTimer) {
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
    this.rejoinTimer = setTimeout(() => {
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
    const el = document.getElementById('yx-tc-uploadCenter');
    if (el) {
      el.click();
    }
  }

  // 从其他文档切回白板
  switchToBoard() {
    this.drawPlugin?.gotoBoard('whiteboard');
  }

  updateContainerAfterResize() {
    this.drawPlugin?.updateContainerAfterResize();
  }
}

export default NetEase;
