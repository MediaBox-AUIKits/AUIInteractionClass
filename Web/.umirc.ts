import { defineConfig } from 'umi';

export default defineConfig({
  alias: {
    '@': './src',
  },
  history: {
    type: 'hash',
  },
  define: {
    ASSETS_VERSION: require('./package.json').version,
    PUBLIC_PATH: '/',
    // 请修改为您的配置
    CONFIG: {
      appServer: {
        origin: '', // 配置 APPServer 服务域名，例子: https://xxx.xxx.xxx，结尾字符请勿是 /
        apiPrefixPath: '/api', // 配置api接口路径前缀
      },
      reporter: {
        enable: false, // 是否开启埋点
        host: '', // 所在地域的服务入口
        projectName: '', // sls 的工程名称
        logstore: '', // sls 的 logstore
      },
      // IM 服务配置
      imServer: {
        // 请先开通阿里云互动消息服务，https://help.aliyun.com/zh/live/user-guide/interactive-messaging-overview?spm=a2c4g.11186623.0.0
        aliyunIMV1: {
          enable: true, // 是否开启
          primary: false, // 是否是首选
        },
        // 请先开通融云 IM 服务，https://www.rongcloud.cn/product/im?_sasdk=fMjQ4ODE3
        rongCloud: {
          enable: true,
          primary: false,
          appKey: '', // 融云 SDK 的 AppKey，从控制台上获取
        },
        aliyunIMV2: {
          enable: true,
          primary: true,
        }
      },
    },
  },
  mfsu: true,
  metas: [
    {
      name: 'Viewport',
      content:
        'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover',
    },
    {
      name: 'description',
      content: '阿里云互动课堂',
    },
  ],
  routes: [
    {
      path: '/',
      component: 'index',
    },
    {
      path: '/classroom',
      component: 'classroom',
      wrappers: ['@/wrappers/auth'],
    },
  ],
  plugins: ['@umijs/plugins/dist/antd'],
  antd: {
    import: true,
  },
  theme: {
    'line-height-base': 1.5,
    'font-size-base': '12px',
    'primary-color': '#1597FF',
    'primary-color-hover': '#3CA5FF',
    'primary-color-active': '#0773D9',
    'success-color': '#1e8e3e',
    'warning-color': '#ff8f1f',
    'error-color': '#f53f3f',
    'error-color-active': '#CF2B31',
    'error-color-hover': '#FF706B',
    'label-color': '#494F61',
    'text-color': '#3A3D48',
    'text-color-secondary': '#747A8C',
    'form-item-margin-bottom': '22px',
    'form-vertical-label-padding': '0 0 6px',
    'input-placeholder-color': '#B2B7C4',
  },
  // 兼容 es5，使用这两个压缩工具
  // jsMinifier: 'esbuild',
  // cssMinifier: 'cssnano',
  legacy: {},
  npmClient: 'npm',
});
