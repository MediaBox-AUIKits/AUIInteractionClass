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
  if (typeof data !== 'object' || !data) return data;

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
  if (typeof data !== 'object' || !data) return data;

  if (Array.isArray(data)) {
    return data.map(item => convertToUnderline(item));
  }

  let newObj: BasicMap<any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      let newKey = key.replace(/[A-Z]/g, match => {
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

/**
 * 根据 userId 首字母取用户头像，用于测试，真实项目请使用真实数据
 * @param {string} userId
 * @return {string}
 */
export function getRandomAvatar(userId: string) {
  const DefaultAvatars = [
    'https://img.alicdn.com/imgextra/i1/O1CN01chynzk1uKkiHiQIvE_!!6000000006019-2-tps-80-80.png',
    'https://img.alicdn.com/imgextra/i4/O1CN01kpUDlF1sEgEJMKHH8_!!6000000005735-2-tps-80-80.png',
    'https://img.alicdn.com/imgextra/i4/O1CN01ES6H0u21ObLta9mAF_!!6000000006975-2-tps-80-80.png',
    'https://img.alicdn.com/imgextra/i1/O1CN01KWVPkd1Q9omnAnzAL_!!6000000001934-2-tps-80-80.png',
    'https://img.alicdn.com/imgextra/i1/O1CN01P6zzLk1muv3zymjjD_!!6000000005015-2-tps-80-80.png',
    'https://img.alicdn.com/imgextra/i2/O1CN01ZDasLb1Ca0ogtITHO_!!6000000000096-2-tps-80-80.png',
  ];

  if (!userId) {
    return DefaultAvatars[0];
  }
  return DefaultAvatars[userId.charCodeAt(0) % DefaultAvatars.length];
}

export const getEnumKey = (enumObj: Object, value: any) => {
  const keyIndex = Object.values(enumObj).indexOf(value);
  return Object.keys(enumObj)[keyIndex];
};
