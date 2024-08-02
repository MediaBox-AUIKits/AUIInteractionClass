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

在 `CONFIG.appServer` 中配置上面前提条件 AppServer 服务的参数

```typescript
appServer: {
  // 配置 APPServer 服务域名，结尾字符请勿是 /，服务端需要开启可跨域设置
  origin: 'https://xxx.xxx.xxx',
   // 配置api接口路径前缀
  apiPrefixPath: '/api',
}
```

若有些业务上的定制，可以直接修改 src/services/base.ts 文件中 `ServicesOrigin`、`ApiPrefixPath` 等变量。

#### 配置 SLS 日志

若您需要上报课堂项目的日志，可以在 `CONFIG.reporter` 中配置相关参数，更多说明请查看 [SLS 官网文档](https://help.aliyun.com/zh/sls/) 。

```typescript
reporter: {
  enable: true, // true: 开启日志上报，false: 关闭
  host: '', // 所在地域的服务入口，如：cn-hangzhou.log.aliyuncs.com
  projectName: '', // sls 的工程名称
  logstore: '', // sls 的 logstore
},
```

项目中默认已支持部分关键行为的上报，如需要修改，请至 src/utils/Reporter.ts 、src/Components/ClassRoom/utils/Logger.ts 等文件中修改。

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

目前项目集成了 [网易云信互动白板](https://yunxin.163.com/whiteboard) 服务，您需要开通其服务，且实现 AppServer 中白板相关的接口才能跑通整个流程，相关的 API 文档可以查看其官方文档以及 typings/netease 文件夹下的定义文件。

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

构建的文件主要为 index.html 、umi.js、umi.css ，其余的是按需加载的资源文件。<br />
请根据您部署生产环境、加载资源的情况配置 .umirc.ts 的 `publicPath` 。若您最终访问的页面是单独加载生成的 js、css 资源的话，无需配置 `publicPath`；但若是直接使用 index.html 则请参考下面的例子，根据您实际情况进行配置。

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

本项目主要实现了课堂页面以及配套用于 DEMO 体验的登录页面。src/pages 文件夹下的 index.tsx 、classroom.tsx 为登录页和课堂页的入口文件，对应的主要功能逻辑写在 src/components 下的 Login、ClassRoom 文件夹中。<br>
本项目同时支持教师端、助教端、学生端。教师/助教身份目前仅支持在 PC 端进入课堂；学生身份可以通过 PC 或移动端进入课堂。

### 教师端

请在 Windows、macOS 等桌面设备的浏览器中访问。

#### 登录

> 效果图

![教师端登陆页](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/0416806071/p761861.png)

- 课堂角色：教师；
- 课堂类型：
  - 公开课：学生端支持观看、聊天等功能；
  - 大班课：可连麦互动，学生端支持连麦、观看、聊天等功能；
- 教室号：
  - 课堂角色为教师时，非必填；支持填入已创建的教室号，不填则新建教室；
  - 课堂角色为助教时，必填，填入已创建的教室号；
  - 课堂角色为学生时，必填，填入已创建的教室号；
- 用户名称：必填；
- 助教设置：教师角色支持设置是否启用助教，配置助教权限；

#### 教室

> 效果图

![教师端教室页](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4677391071/p745222.png)

- 上课与下课；
- 设备开关与选择；
- 白板涂鸦与文档分享；
- 共享屏幕；
- 多媒体插播（目前仅支持视频播放）；
- 主次画面切换；
- 编辑公告；
- 发布签到；
- 互动消息：
  - 全员禁言（或解除）；
  - 单人禁言（或解除）；
  - 删除群消息；
- 成员管理：
  - 展示教室中成员及状态（在教室中/已离开/被移除/连麦状态）；
  - 将学生移除出教室；
- 连麦互动与管理（仅大班课支持）：
  - 全局设置：
    - 允许连麦（或禁止）；
    - 全员静音（关闭所有学生的麦克风）；
  - 连麦操作：
    - 邀请学生连麦（或取消邀请）；
    - 同意或拒绝学生连麦申请；
    - 开启或关闭学生的摄像头或麦克风；
    - 结束连麦；

### 助教端

请在 Windows、macOS 等桌面设备的浏览器中访问。

#### 登录

> 效果图

![助教端登陆页](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/0416806071/p761845.png)

- 课堂角色：助教；
- 教室号：必填，填入已创建的教室号；
- 用户名称：必填；

#### 教室

> 效果图

![助教端教室页](https://intranetproxy.alipay.com/skylark/lark/0/2023/jpeg/18856688/1701951957823-70ffb934-1778-4eef-ab04-0ca85e8ed2d5.jpeg?x-oss-process=image%2Fresize%2Cw_959%2Climit_0%2Finterlace%2C1)

根据教师设置的助教权限，可使用：

- 课程管理：
  - 编辑公告；
  - 成员管理：将学生移除出教室；
  - 发布签到；
- 辅助教学：
  - 可见&白板翻页；
- 互动消息：
  - 删除群消息；
  - 全员禁言（或解除）；
  - 单人禁言（或解除）；
- 主次画面切换；

### 学生端

请在 Windows、macOS 等桌面设备，或 Android、iOS 等移动设备的浏览器中访问。

#### 登录

> 效果图（PC 端/移动端）

![学生端登陆页](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4677391071/p745226.png)

- 课堂角色：学生；
- 教室号：必填，填入已创建的教室号；
- 用户名称：必填；

#### 教室

进入课堂后，会根据班型展示不同 UI。

##### 公开课

> 效果图

![学生端教室页](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4677391071/p745228.png)

- 课堂直播：教师端摄像头画面+白板/屏幕共享/多媒体插播；
- 聊天；
- 课堂简介；
- 课堂公告；

##### 大班课

> 效果图

![学生端教室页](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4677391071/p745231.png)

- 课堂直播：
  - 单/双区展示教师画面：
    - 双区展示（优先）：分区展示教师端摄像头画面和白板/屏幕共享/多媒体插播；客户端使用 WebRTC 协议（RTS1.0）拉流，保证流间低时差；
    - 单区展示（降级）：若浏览器环境不支持 WebRTC 或出现 RTS 降级，则使用公开课的布局方式，直播内容为教师端摄像头画面+白板/屏幕共享/多媒体插播；
  - 麦上/麦下：
    - 麦上学生（仅支持学生通过 PC 端连麦，底层协议为 WebRTC）：
      - 主画面：教师端白板/屏幕共享/多媒体插播；
      - 右上角（主讲）：教师端摄像头画面；
      - 演讲者视图：麦上学生摄像头画面；
    - 麦下学生：
      - 主画面：教师端白板/屏幕共享/多媒体插播；
      - 右上角：麦上所有人的摄像头混流画面；
- 连麦互动：
  - 申请连麦（或取消申请）；
  - 同意或拒绝教师的连麦邀请；
  - 设备开关与选择；
- 聊天；
- 课堂简介；
- 课堂公告；
- 签到；
- 主次画面切换；

## 由您实现

本项目着重课堂模块的开发，其余配套的模块还需要您自行完善才能真正对外服务 C 端用户。

### 登录

当前项目中的登录模块为示例代码，Appserver 服务提供了以明文发送用户名及密码的 `login` 接口来获取身份 token，这部分逻辑仅仅只能作为本地开发、体验使用，切勿在实际生产环境中使用，请自行请接入 SSO 单点登录、OAuth2 等方案。<br>
当前项目中的进入课堂页面时会先校验是否已登录，若未登录会先重定向到登录页，该部分逻辑位于 src/wrappers/auth/index.tsx 中，请自行按您实际情况进行修改。

### 课堂管理

当前项目中并不包含课堂管理模块，如果您需要更丰富的课堂管理功能，比如：

- 展示历史课堂信息：课堂成员，在课堂中的时间统计、连麦时长、发言数等；
- 对已经创建过的课堂进行管理，比如重启课堂、永久关闭、导出课堂数据等；

以上及更多能力，需要您自行实现相关的业务。

### 成员管理

当前项目实现了成员列表、移除成员、禁言（单人/群组）、删除群消息等功能，若您需要更丰富的成员管理功能，需要您自行实现相关的业务。

### 连麦管理

当前项目使用状态机模式结合 IM 通信实现了简单的连麦管理，在教师端和学生端之间进行连麦信令交换，比如：

- 教师邀请学生连麦（及取消邀请）
- 学生申请连麦（及取消申请）
- 教师/学生结束连麦
- 教师控制学生的设备开关状态
- 教师允许连麦（或禁止连麦）

若您需要更丰富、更贴合业务的的连麦管理功能，需要您自行实现相关的业务。

### 助教权限

当前项目已实现了一部分通用的助教功能，基于状态机模式结合 IM 通信，实现教师和助教之间的管理员协作通信，比如同步课件更新、共同管理互动消息等。若您需要更丰富的课堂协作能力，需要您自行实现。

### 直播混流

不同班型，直播流的内容有所区别。

#### 公开课

StreamName 后缀为 `${teacherId}_camera`：主次画面混流，即教师摄像头流+白板/本地视频插播/屏幕共享流的合流画面；

#### 大班课

- StreamName 后缀为 `${teacherId}_camera`：教师摄像头流，单路流；
- StreamName 后缀为 `${teacherId}_shareScreen`：教师白板/本地视频插播/屏幕共享流，单路流；
- StreamName 后缀为 `${teacherId}_shadow_camera`：
  - 未连麦：默认展位图；
  - 连麦：连麦成员的摄像头流混流；
- StreamName 后缀为 `${teacherId}_shadow_shareScreen`：主次画面混流，即教师摄像头流+白板/本地视频插播/屏幕共享流的合流画面；

上述混流逻辑，您可以按需修改。比如若您的大班课，不需要使用单路流进行直播观看和录制，即混流效果呈现在 `${teacherId}_camera/${teacherId}_shareScreen` 上，那您就不需要实例化 `ShadowInstance`，在 Web/src/components/ClassRoom/pc/TeacherPage.tsx 中修改。

### 录制回放

当前项目未实现课堂录制回放，若您需要这部分功能，可参考下述指引自行实现。

#### 创建录制模板

首先，您需要针对 AppServer 中 `live_stream.pull_url` 指定的直播播流域名配置录制模板（操作步骤可见：[互动课堂/前置准备/步骤七：（建议）配置录制回放](https://help.aliyun.com/document_detail/2401442.html#50ef4f60569dy)）。这里，需要注意两个模板参数：

![录制模板](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/0416806071/p761852.png)

- AppName：`live`；
- StreamName：由于课堂直播流 StreamName 每次都会随开课变动，建议您配置为`*`（通配符）。

#### 查看录制文件

在视频直播控制台/直播管理/录制文件管理查看录制文件。注意筛选前述步骤中的直播播流域名、AppName。

#### 获取录制文件地址

- 接口：
  - 通过视频点播的 OpenAPI `SearchMedia` 传入 `title = ${streamName}` 搜索点播文件
    https://help.aliyun.com/zh/vod/developer-reference/api-vod-2017-03-21-searchmedia
  - 调用视频点播的 OpenAPI `GetPlayInfo` 获取播放地址
    https://help.aliyun.com/zh/vod/developer-reference/api-vod-2017-03-21-getplayinfo
- 配置录制回调，参考直播转点播

#### 录制文件播放

使用 Aliplayer 进行点播播放，参考点播视频播放。

## 依赖服务及三方包

本项目通过 npm 包以及在 plugin.ts 中引入前端方式使用了多个三方包及服务，下面将介绍重点项。

### VConsole

plugin.ts 中引入 VConsole SDK ，用于在移动端测试，目前默认不会开启，当 url 中包含 `vconsole=1` 的参数时才会开启。

### AliPlayer

plugin.ts 中引入 AliPlayer SDK，用于在直播间中播放直播流，详细内容请至 [官网](https://help.aliyun.com/document_detail/125548.html) 了解。

### 多 IM SDK

项目在 plugin.ts 中引入了 imp-interaction，以及 package.json 中的三方包 @rongcloud/imlib-next/@rongcloud/engine，这两组 IM SDK 实现互动课堂的信令协商、群组消息、群组管理；多通道消息并发，提升消息达到速度和稳定性。您可以根据需要，开通对应服务，并在 plugin.ts 中开启某些通道并设置主通道。<br>
我们强烈推荐启用 aliyunIMV2 并将其设置为 `primary ，demo 中较多功能依赖 aliyunIMV2 的能力；<br>
Appserver 所提供的 token 接口会返回各个通道认证所需的 token。

### alivc-live-push

plugin.ts 中引入了 alivc-live-push.js 用于推流，详细文档请查看 [官网文档](https://help.aliyun.com/zh/live/developer-reference/web-lianmai-interactive-sdk-integration)

### 白板

当前 public/script 中的文件为网易云信白板 SDK，您首先需要开通 [网易云信白板](https://yunxin.163.com/whiteboard) 的服务，并且实现 AppServer 中相关的接口。

### axios

开源的 http 请求 npm 包，用于调用 Appserver 接口，详细文档请至 [官网](https://github.com/axios/axios) 了解。
