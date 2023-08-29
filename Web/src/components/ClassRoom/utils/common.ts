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

/**
 * 简单实现格式化日期，若需要使用更复杂的功能，建议使用如 momentjs 等库
 * @param {Date} date
 * @return {string}
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date && !isNaN(date as any))) {
    return '';
  }

  const padZore = (str: string | number) => {
    return `0${str}`.slice(-2);
  };

  return `${date.getFullYear()}-${padZore(date.getMonth() + 1)}-${padZore(
    date.getDate()
  )} ${padZore(date.getHours())}:${padZore(date.getMinutes())}`;
}

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
