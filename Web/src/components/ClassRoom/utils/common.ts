// 判断当前在哪个platform
export const UA = (() => {
  const ua = navigator.userAgent;
  const isAndroid = /(?:Android)/.test(ua);
  const isFireFox = /(?:Firefox)/.test(ua);
  const isPad =
    /(?:iPad|PlayBook)/.test(ua) ||
    (isAndroid && !/(?:Mobile)/.test(ua)) ||
    (isFireFox && /(?:Tablet)/.test(ua));
  const isiPad =
    /(?:iPad)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isiPhone = /(?:iPhone)/.test(ua) && !isPad;
  const isPC = !isiPhone && !isAndroid && !isPad && !isiPad;
  // 判断夸克和UC
  const isQuark = /(?:Quark)/.test(ua);
  const isUC = /(?:UCBrowser)/.test(ua);
  return {
    isPad,
    isiPhone,
    isAndroid,
    isPC,
    isiPad,
    isQuark,
    isUC,
  };
})();

export const replaceHttps = (url: string) => {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/^http:\/\//i, 'https://');
};

/**
 * 时间显示格式化
 * @param current
 * @param start
 * @returns
 */
export const getTimeFormat = (current: Date, start: Date) => {
  const secondCount = Math.floor((current.getTime() - start.getTime()) / 1000);
  if (!secondCount || secondCount < 0) {
    return '00:00:00';
  }

  const second = `${secondCount % 60}`.padStart(2, '0');
  const minute = `${Math.floor(secondCount / 60) % 60}`.padStart(2, '0');
  const hour = `${Math.floor(secondCount / 60 / 60)}`.padStart(2, '0');

  return `${hour}:${minute}:${second}`;
};

const padZore = (str: string | number) => {
  return `0${str}`.slice(-2);
};

/**
 * 简单实现格式化日期，若需要使用更复杂的功能，建议使用如 momentjs 等库
 * @param {Date} date
 * @return {string}
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date && !isNaN(date as any))) {
    return '';
  }
  return `${date.getFullYear()}-${padZore(date.getMonth() + 1)}-${padZore(
    date.getDate()
  )} ${padZore(date.getHours())}:${padZore(date.getMinutes())}`;
}

export function formatTime(date: Date): string {
  if (!(date instanceof Date && !isNaN(date as any))) {
    return '';
  }

  const padZore = (str: string | number) => {
    return `0${str}`.slice(-2);
  };

  return `${date.getFullYear()}-${padZore(date.getMonth() + 1)}-${padZore(
    date.getDate()
  )} ${padZore(date.getHours())}:${padZore(date.getMinutes())}:${padZore(
    date.getSeconds()
  )}.${date.getMilliseconds()}`;
}

const SECS_PER_HOUR = 3600;
const SECS_PER_MIN = 60;
// 秒换算为时/分/秒
export const getDisplayBySeconds = (
  seconds: number
): { hour: string; min: string; sec: string } => {
  let [hour, min, sec] = [0, 0, 0];
  hour = Math.floor(seconds / SECS_PER_HOUR);
  min = Math.floor((seconds - hour * SECS_PER_HOUR) / SECS_PER_MIN);
  sec = seconds - hour * SECS_PER_HOUR - min * SECS_PER_MIN;
  return {
    hour: padZore(hour),
    min: padZore(min),
    sec: padZore(sec),
  };
};

/**
 * 简单滚动到底部的实现
 * @param {HTMLDivElement} dom
 */
export function scrollToBottom(dom: HTMLElement) {
  dom.scrollTo({
    top: Math.max(dom.scrollHeight - dom.offsetHeight, 0),
    behavior: 'smooth',
  });
}

/**
 * 判断当前设置是否支持constant(safe-area-inset-top)或env(safe-area-inset-top)或
 * constant(safe-area-inset-bottom)或env(safe-area-inset-bottom)
 * 部分Android设备，可以认识safa-area-inset-top、safe-area-inset-bottom，但会将其识别为0
 * @param {boolean} [top] 检查 top 或者 bottom
 * @returns {boolean} 当前设备是否支持安全距离
 */
export function supportSafeArea(side: 'top' | 'bottom'): boolean {
  const div = document.createElement('div');
  const id = 'check-safe-area-block';
  const styles = ['position: fixed', 'z-index: -1'];
  if (side === 'top') {
    styles.push(
      ...[
        'height: constant(safe-area-inset-top)',
        'height: env(safe-area-inset-top)',
      ]
    );
  } else {
    styles.push(
      ...[
        'height: constant(safe-area-inset-bottom)',
        'height: env(safe-area-inset-bottom)',
      ]
    );
  }
  div.style.cssText = styles.join(';');
  div.id = id;
  document.body.appendChild(div);
  const areaDiv = document.getElementById(id);
  let bool = false;
  if (areaDiv) {
    bool = areaDiv.offsetHeight > 0; // 该 div 的高度是否为 0
    areaDiv.parentNode?.removeChild(areaDiv);
  }
  return bool;
}

/**
 * 异步加载远程js
 * @param {string} url
 * @returns {Promise}
 */
export function loadJS(url: string) {
  if (!url) {
    return Promise.reject(new Error('url error'));
  }

  // 检测是否已存在
  const target = document.querySelector(`script[src='${url}']`);
  if (target) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';

    script.onload = () => {
      resolve();
    };

    script.onerror = err => {
      reject(err);
      script.remove();
    };

    script.src = url;
    document.body.appendChild(script);
  });
}

/**
 * 设备列表排重，解决同一个设备多次出现的情况
 * @param deviceList
 * @returns
 */
export const uniqueDevice = (
  deviceList: MediaDeviceInfo[]
): MediaDeviceInfo[] => {
  const tmpGroupIdMap: {
    [key: string]: number;
  } = {};

  for (let i = 0; i < deviceList.length; i++) {
    const device = deviceList[i];
    const sameIndex = tmpGroupIdMap[device.groupId];

    if (sameIndex === undefined) {
      tmpGroupIdMap[device.groupId] = i;
    } else {
      // 删除当前节点
      deviceList.splice(i, 1);
      // 位置取最前面一个，取值取 deviceId 长的一个
      const sameDevice = deviceList[sameIndex];
      if (device.deviceId.length > sameDevice.deviceId.length) {
        deviceList[sameIndex] = device;
      }
    }
  }

  return deviceList;
};

/**
 * 判断是否是合法的 Date
 *
 * @param {*} d
 * @return {boolean}
 */
export function isValidDate(d: any): boolean {
  return !isNaN(d) && d instanceof Date;
}

/**
 * 检测 WebRTC 各项功能支持情况
 */
export function checkSystemRequirements(): Promise<{
  support: boolean;
  isBrowserSupported?: boolean;
  isH264DecodeSupported?: boolean;
  isH264EncodeSupported?: boolean;
  isWebRTCSupported?: boolean;
}> {
  return window.AlivcLivePush.AlivcLivePusher.checkSystemRequirements();
}

/**
 * 根据容器的宽高和元素的宽高比，计算数组的布局
 */
export function getLayoutArray(
  arr: Array<{ userId: string }>,
  containerWidth: number,
  containerHeight: number,
  itemRatio: number
) {
  const len = arr.length;
  const cols = Math.ceil(Math.sqrt(len));
  const rows = Math.ceil(len / cols);

  // 先决定是左右贴边还是上下贴边，平均每列宽度/平均每列高度是否大于 itemRatio，如果是，说明左右两边有空隙，否则是上下两边有空隙
  const hasRedundantWidth =
    containerWidth / cols / (containerHeight / rows) > itemRatio;

  let horizontalMargin = 0;
  let verticalMargin = 0;
  if (hasRedundantWidth) {
    horizontalMargin =
      (containerWidth - (containerHeight / rows) * itemRatio * cols) / 2;
  } else {
    verticalMargin =
      (containerHeight - (containerWidth / cols / itemRatio) * rows) / 2;
  }

  const itemWidth = (containerWidth - horizontalMargin * 2) / cols;
  const itemHeight = itemWidth / itemRatio;

  return arr.map((item, index) => ({
    userId: item.userId,
    x:
      len === 3 && index === 2
        ? (containerWidth - itemWidth) / 2 // len 为 3 时最后一个元素的 x 会比较特殊
        : (index % cols) * itemWidth + horizontalMargin,
    y: Math.floor(index / cols) * itemHeight + verticalMargin,
    width: itemWidth,
    height: itemHeight,
  }));
}

/**
 * 随机生成一个数字 uid
 * @param {number} prefix 需要是正整数
 * @return {number}
 */
export function createRandomNumberUid(prefix: number): number {
  const now = Date.now();
  // 000 - 999 随机取一个
  const random = `${Math.floor(Math.random() * 1000)}`.padStart(3, '0');
  const str = `${prefix}${random}${now}`;
  const uid = Number(str);
  if (isNaN(uid)) {
    throw new Error('uid is not a number');
  }
  return uid;
}
