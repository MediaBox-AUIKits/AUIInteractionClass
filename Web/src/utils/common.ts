import { BasicMap } from '@/types';

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

/**
 * 从当前 location.search 中获取某个参数值
 * @param {string} key
 * @return {*} 
 */
export function getParamFromSearch(key: string) {
  const url = window.location.search;
  const reg = new RegExp(`(^|&)${key}=([^&]*)(&|$)`);
  const result = url.substring(1).match(reg);
  return result ? decodeURIComponent(result[2]) : null;
}

// 从下划线格式转为驼峰
export function convertToCamel(data: any): any {
  if (typeof data !== 'object' || !data) return data

  if (Array.isArray(data)) {
    return data.map(item => convertToCamel(item));
  }

  let newObj: BasicMap<any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      let newKey = key.replace(/_([a-z])/g, res => res[1].toUpperCase());
      newObj[newKey] = convertToCamel(data[key]);
    }
  }
  return newObj;
}

/**
 * 驼峰转下划线
 * @param {*} data
 * @return {*}
 */
export function convertToUnderline(data: any): any {
  if (typeof data !== 'object' || !data) return data

  if (Array.isArray(data)) {
    return data.map(item => convertToUnderline(item));
  }

  let newObj: BasicMap<any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      let newKey = key.replace(/[A-Z]/g, (match) => {
        return '_' + match.toLowerCase();
      });
      // 如果首字母是大写，执行replace时会多一个_，这里需要去掉
      if (newKey[0] === '_') {
        newKey = newKey.slice(1);
      }
      newObj[newKey] = convertToUnderline(data[key]);
    }
  }
  return newObj;
}
