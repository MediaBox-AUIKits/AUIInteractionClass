import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Popover } from 'antd';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import livePush from '../../utils/LivePush';
import logger from '../../utils/Logger';
import { ScreenShareSvg, ScreenShareDisableSvg } from '../../components/icons';
import toast from '@/utils/toast';
import styles from './index.less';

const ScreenShare: React.FC = () => {
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const { setDisplayEnable } = useClassroomStore.getState();
  const { enable } = useClassroomStore(state => state.display);
  const localPreviewing = useClassroomStore(
    state => state.localMedia.sources.length !== 0
  );
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      logger.stopScreen();
      setDisplayEnable(false);
    };

    // 通过监听 screenshareended 屏幕分享轨结束事件，同步状态
    livePusher.info.on('screenshareended', handler);

    return () => {
      livePusher.info.off('screenshareended', handler);
    };
  }, [livePusher, setDisplayEnable]);

  const toggleScreenShare = useCallback(() => {
    if (localPreviewing) {
      return;
    }
    if (enable) {
      logger.stopScreen();
      livePusher
        .stopScreenShare()
        .then(() => {
          setDisplayEnable(false);
        })
        .catch((err: any) => {
          logger.stopScreenError(err);
          console.log('停止屏幕分享失败', err);
        });
    } else {
      const bool = livePusher.checkScreenShareSupported();
      logger.screenShareSupported(bool);
      if (!bool) {
        toast.error('无屏幕分享的权限！');
        return;
      }
      logger.startScreen();
      livePusher
        ?.startScreenShare()
        .then(() => {
          setDisplayEnable(true);
        })
        .catch((err: any) => {
          logger.startScreenError(err);
          console.log('屏幕分享失败', err);
        });
    }
  }, [livePusher, enable, localPreviewing]);

  return (
    <Popover
      content="关闭音视频画面后可恢复使用"
      open={tipOpen}
      onOpenChange={bool => {
        setTipOpen(localPreviewing ? bool : false);
      }}
    >
      <div className={styles['button-wrapper']}>
        <div
          className={classNames(styles.button, {
            [styles.active]: enable,
            [styles.disabled]: localPreviewing,
          })}
          onClick={toggleScreenShare}
        >
          {localPreviewing ? <ScreenShareDisableSvg /> : <ScreenShareSvg />}
          <div className={styles['button-text']}>
            {enable ? '结束共享' : '共享屏幕'}
          </div>
        </div>
      </div>
    </Popover>
  );
};

export default ScreenShare;
