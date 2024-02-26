import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Popover } from 'antd';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import livePush from '../../utils/LivePush';
import logger, { EMsgid } from '../../utils/Logger';
import { PermissionVerificationProps } from '../../types';
import { ScreenShareSvg, ScreenShareDisableSvg } from '../../components/icons';
import styles from './index.less';

const ScreenShare: React.FC<PermissionVerificationProps> = props => {
  const { noPermission = false, noPermissionNotify } = props;
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const localPreviewing = useClassroomStore(
    state => state.localMedia.sources.length !== 0
  );
  const [screenShareSupported, setScreenShareSupported] = useState(true);

  const disabled = useMemo(
    () => noPermission || !screenShareSupported || localPreviewing,
    [localPreviewing, noPermission, screenShareSupported]
  );
  const disabledText = useMemo(() => {
    if (noPermission) return noPermissionNotify;
    if (!screenShareSupported) return '无屏幕分享的权限';
    if (localPreviewing) return '关闭音视频画面后可恢复使用';
  }, [localPreviewing]);

  const { setDisplayEnable } = useClassroomStore.getState();
  const { enable } = useClassroomStore(state => state.display);

  useEffect(() => {
    if (livePusher) {
      const bool = livePusher.checkScreenShareSupported();
      setScreenShareSupported(bool);
      logger.reportInfo(EMsgid.SCREEN_SHARE_SUPPORTED, { supported: bool });
    }
  }, [livePusher]);

  useEffect(() => {
    const handler = () => {
      setDisplayEnable(false);

      logger.reportInvoke(EMsgid.STOP_SCREEN);
    };

    // 通过监听 screenshareended 屏幕分享轨结束事件，同步状态
    livePusher.info.on('screenshareended', handler);

    return () => {
      livePusher.info.off('screenshareended', handler);
    };
  }, [livePusher, setDisplayEnable]);

  const toggleScreenShare = useCallback(() => {
    if (disabled) {
      return;
    }

    if (enable) {
      logger.reportInvoke(EMsgid.STOP_SCREEN);

      livePusher
        .stopScreenShare()
        .then(() => {
          setDisplayEnable(false);
          logger.reportInvokeResult(EMsgid.STOP_SCREEN_RESULT, true);
        })
        .catch((err: any) => {
          console.log('停止屏幕分享失败', err);

          logger.reportInvokeResult(EMsgid.STOP_SCREEN_RESULT, false, '', err);
        });
    } else {
      logger.reportInvoke(EMsgid.START_SCREEN);

      livePusher
        ?.startScreenShare(true)
        .then(() => {
          setDisplayEnable(true);
          // 设定屏幕共享流建议的分辨率、码率；实际的流质量会受限于浏览器策略和网络状况
          livePusher?.updateScreenVideoProfile(1920, 1080, 3000, 20);
          logger.reportInvokeResult(EMsgid.START_SCREEN_RESULT, true);
        })
        .catch((err: any) => {
          console.log('屏幕分享失败', err);
          logger.reportInvokeResult(EMsgid.START_SCREEN_RESULT, false, '', err);
        });
    }
  }, [livePusher, enable, localPreviewing]);

  return (
    <Popover content={disabledText}>
      <div className={styles['button-wrapper']}>
        <div
          className={classNames(styles.button, {
            [styles.active]: enable,
            [styles.disabled]: disabled,
          })}
          onClick={toggleScreenShare}
        >
          {disabled ? <ScreenShareDisableSvg /> : <ScreenShareSvg />}
          <div className={styles['button-text']}>
            {enable ? '结束共享' : '共享屏幕'}
          </div>
        </div>
      </div>
    </Popover>
  );
};

export default ScreenShare;
