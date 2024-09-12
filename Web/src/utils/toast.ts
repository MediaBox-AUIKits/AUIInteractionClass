import React from 'react';
import { message } from 'antd';
import type { NoticeType } from 'antd/lib/message';
import { Toast } from 'antd-mobile';
import { UA } from '@/utils/common';

interface PcToastConfig {
  type?: NoticeType;
  duration?: number;
  key?: number | string;
  className?: string;
}

interface MobileToastConfig {
  icon?: 'success' | 'fail' | 'loading' | React.ReactNode;
  duration?: number;
}

const IconMapByType = {
  success: 'success',
  error: 'fail',
};

const toast = (
  content: string,
  pcConfig?: PcToastConfig,
  mobileConfig?: MobileToastConfig,
) => {
  if (UA.isPC) {
    const type = pcConfig?.type ?? 'info';
    const duration = pcConfig?.duration ?? 3;
    return message.open({
      ...(pcConfig ?? {}),
      type,
      duration,
      content,
    });
  }

  const { icon: _icon, duration = 2000 } = mobileConfig ?? {};
  const icon =
    _icon ??
    ((pcConfig?.type === 'success' || pcConfig?.type === 'error') &&
      IconMapByType[pcConfig.type]);
  return Toast.show({
    content,
    icon,
    duration,
  });
};

toast.success = (content: string, pcDuration = 3, mobileDuration = 2000) => {
  UA.isPC
    ? message.success({
        content,
        duration: pcDuration,
      })
    : Toast.show({
        content,
        icon: IconMapByType.success,
        duration: mobileDuration,
      });
};

toast.error = (content: string, pcDuration = 3, mobileDuration = 2000) => {
  UA.isPC
    ? message.error({
        content,
        duration: pcDuration,
      })
    : Toast.show({
        content,
        icon: IconMapByType.error,
        duration: mobileDuration,
      });
};

toast.warning = (content: string, pcDuration = 3, mobileDuration = 2000) => {
  UA.isPC
    ? message.warning({
        content,
        duration: pcDuration,
      })
    : Toast.show({
        content,
        duration: mobileDuration,
      });
};

toast.destroy = (key?: string | number) => {
  if (UA.isPC) {
    message.destroy(key);
  } else {
    Toast.clear();
  }
};

export default toast;
