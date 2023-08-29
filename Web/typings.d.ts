import 'umi/typings';
import * as IMLib from '@rongcloud/imlib-next';
import type { AliyunInteraction } from './typings/AliyunInteraction';
import type WhiteBoardSDK, { WhiteBoardSDKInstance } from './typings/netease/WhiteBoardSDK';
import type ToolCollection, { ToolCollectionInstance } from 'typings/netease/ToolCollection';
import type { DrawPlugin } from 'typings/netease/DrawPlugin';

declare global {
  type RongIMLib = typeof IMLib;

  interface Window {
    AliyunInteraction: AliyunInteraction;
    Aliplayer: any;
    AlivcLivePush: any;
  }

  const WhiteBoardSDK: WhiteBoardSDK;
  const WhiteBoardSDKInstance: WhiteBoardSDKInstance;
  const ToolCollection: ToolCollection;
  const ToolCollectionInstance: ToolCollectionInstance;
  const DrawPlugin: DrawPlugin;

  const ASSETS_VERSION: string;
  const PUBLIC_PATH: string;
  const CONFIG: {
    appServer: {
      origin: string;
      apiPrefixPath: string;
    },
    reporter: {
      enable: boolean; // 是否开启埋点
      host: string; // 所在地域的服务入口
      projectName: string; // sls 的工程名称
      logstore: string; // sls 的 logstore
    },
    imServer: {
      aliyun: {
        enable: boolean; // 是否开启阿里云互动消息服务
        primary?: boolean; // 是否是主消息服务
      },
      rongCloud: {
        enable: boolean; // 是否开启融云互动消息服务
        appKey: string; // 融云的AppKey，用于初始化
        primary?: boolean; // 是否是主消息服务
      }
    },
  };
}
