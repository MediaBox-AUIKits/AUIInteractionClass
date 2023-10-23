# 互动课堂

## 前提

请先接入、运行、部署开源的 Appserver 服务，详情请参考 [官网文档](https://help.aliyun.com/document_detail/2526645.html) 。

## 开发框架

本项目使用 UmiJS 框架开发，技术栈为 React + TypeScript ，详细请了解 [UmiJS 官方文档](https://umijs.org/docs/introduce/introduce)。

## 集成流程

### 环境准备

若您本地已经安装好 Node 环境请跳过此步骤，否则请参考[ UmiJS 快速上手教程](https://umijs.org/docs/tutorials/getting-started) 将环境准备好。

### 配置

请在 .umirc.ts 文件中的 CONFIG 对象中配置项目所需参数

#### 配置 Appserver

在 CONFIG.appServer 中配置上面前提条件 AppServer 服务的参数

```typescript
appServer: {
  // 配置 APPServer 服务域名，结尾字符请勿是 /，服务端需要开启可跨域设置
  origin: 'https://xxx.xxx.xxx',
   // 配置api接口路径前缀
  apiPrefixPath: '/api/v1/class/',
}
```

若有些业务上的定制，可以直接修改 src -> services -> base.ts 文件中 ServicesOrigin、ApiPrefixPath 等变量。

#### 配置 SLS 日志

若您需要上报课堂项目的日志，可以在 CONFIG.reporter 中配置相关参数，更多说明请查看 [SLS 官网文档](https://help.aliyun.com/zh/sls/) 。

```typescript
reporter: {
  enable: true, // true: 开启日志上报，false: 关闭
  host: '', // 所在地域的服务入口，如：cn-hangzhou.log.aliyuncs.com
  projectName: '', // sls 的工程名称
  logstore: '', // sls 的 logstore
},
```

项目中默认已支持部分关键行为的上报，如需要修改，请至 src -> utils -> Reporter.ts 、src -> Components -> ClassRoom -> utils -> Logger.ts 等文件中修改。

#### 配置 IM 服务

项目在 CONFIG.imServer 中配置需要使用的 IM 服务，默认使用 [阿里云互动消息服务](https://help.aliyun.com/zh/live/user-guide/interactive-messaging-overview)，若您需要使用 [融云 IM 服务](https://www.rongcloud.cn/product/im)，请先开通其服务，配置相关参数

```typescript
imServer: {
  // 请先开通阿里云互动消息服务，https://help.aliyun.com/zh/live/user-guide/interactive-messaging-overview?spm=a2c4g.11186623.0.0
  aliyun: {
    enable: true, // 是否开启
    primary: true, // 是否是首选
  },
  // 请先开通融云 IM 服务，https://www.rongcloud.cn/product/im?_sasdk=fMjQ4ODE3
  rongCloud: {
    enable: false,
    primary: false,
    appKey: '', // 融云 SDK 的 AppKey，从控制台上获取
  }
},
```

### 白板

目前项目集成了 [网易云信互动白板](https://yunxin.163.com/whiteboard) 服务，您需要开通其服务，且实现 AppServer 中白板相关的接口才能跑通整个流程，相关的 API 文档可以查看其官方文档以及 typings -> netease 文件夹下的定义文件。

### 本地运行

配置完接口域名后，打开终端，进入工程文件夹，执行下方指令，即可在本地运行起来。

```bash
// 安装 npm 包（安装速度慢）
npm install
// 若已安装 cnpm 、pnpm、tnpm 等工具，请使用选择以下某个指令安装
cnpm install
pnpm install
tnpm install

// 安装完成后，执行 dev 指令，运行成功后根据提示使用浏览器访问即可
npm run dev
```

### 构建配置

```bash
// 运行 build 指令即可构建最终产物至 ./dist 目录下
npm run build
```

构建的文件主要为 index.html 、umi.js、umi.css ，其余的是按需加载的资源文件。<br />请根据您部署生产环境、加载资源的情况配置 .umirc.ts 的 publicPath 。若您最终访问的页面是单独加载生成的 js、css 资源的话，无需配置 publicPath；但若是直接使用 index.html 则请参考下面的例子，根据您实际情况进行配置。

```typescript
import fs from 'fs';
import path from 'path';

const packagejson = fs.readFileSync(path.resolve('./package.json'));
const json = JSON.parse(packagejson.toString());
const publicPath =
  process.env.NODE_ENV === 'production'
    ? `/publicPath/${json.name}/${json.version}/`
    : '/';

export default {
  // 省略其他配置参数

  // 生成的 index.html 里使用的 umi.js 、umi.css 地址的公共路径的默认值是 /
  // 若 index.html 部署的地址是 http://xxxcdn.com/publicPath/amaui-web-classroom/0.0.1/index.html
  // 若不配置 publicPath 直接访问测试、线上环境 index.html，所加载的 umi.js 将会是 http://xxxcdn.com/umi.js
  // 显然不是跟 index.html 目录下了，所以请根据您实际情况配置
  // 例子中使用了项目的 name 、version 在部署目录中，请根据您实际情况配置
  publicPath: publicPath,

  // 同时还需要修改自定义的 PUBLIC_PATH 字段值
  define: {
    PUBLIC_PATH: publicPath,
  },
};
```

## 功能说明

本项目主要实现了课堂页面以及配套用于 DEMO 体验的登录页面。src -> pages 文件夹下的 index.tsx 、classroom.tsx 为登录页和课堂页的入口文件，对应的主要功能逻辑写在 src -> components 下的 Login 、ClassRoom 文件夹中。每个页面中均通过判断当前环境是 pc 还是 mobile 来渲染对应的子模块，目前互动课堂一期 pc 端仅支持教师身份进入课堂，mobile 端仅支持学生身份进入课堂。

## 由您实现

本项目着重课堂模块的开发，其余配套的模块还需要您自行完善才能真正对外服务 C 端用户。

### 登录

当前项目中的登录模块为示例代码，Appserver 服务提供了以明文发送用户名及密码的 login 接口来获取身份 token，这部分逻辑仅仅只能作为本地开发、体验使用，切勿在实际生产环境中使用，请自行请接入 SSO 单点登录、OAuth2 等方案。<br />当前项目中的进入课堂页面时会先校验是否已登录，若未登录会先重定向到登录页，该部分逻辑位于 src -> wrappers -> auth -> index.tsx 中，请自行按您实际情况进行修改。

### 课堂管理

当前项目中并不包含课堂管理模块，您需要自行实现相关的业务。

## 依赖服务及三方包

本项目通过 npm 包以及在 plugin.ts 中引入前端方式使用了多个三方包及服务，下面将介绍重点项。

### VConsole

plugin.ts 中引入 VConsole SDK ，用于在移动端测试，目前默认不会开启，当 url 中包含 vconsole=1 的参数时才会开启。

### AliPlayer

plugin.ts 中引入 AliPlayer SDK，用于在直播间中播放直播流，详细内容请至 [官网](https://help.aliyun.com/document_detail/125548.html) 了解。

### aliyun-interaction-sdk

plugin.ts 中引入了 aliyun-interaction-sdk 用于直播间互动消息的收发，Appserver 所提供的 token 接口会返回互动 sdk 认证所需的 token ，详细文档请查看 [官网文档](https://help.aliyun.com/zh/live/user-guide/integrate-interactive-messaging-for-web)。

### alivc-live-push

plugin.ts 中引入了 alivc-live-push.js 用于推流，详细文档请查看 [官网文档](https://help.aliyun.com/zh/live/developer-reference/web-lianmai-interactive-sdk-integration)

### 白板

当前 public -> script 中的文件为网易云信白板 SDK，您首先需要开通 [网易云信白板](https://yunxin.163.com/whiteboard) 的服务，并且实现 AppServer 中相关的接口。

### axios

开源的 http 请求 npm 包，用于调用 Appserver 接口，详细文档请至 [官网](https://github.com/axios/axios) 了解。
