import React, { useState, useMemo, useCallback } from 'react';
import { Popover } from 'antd';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import whiteBoardFactory from '../../utils/whiteboard';
import { FolderSvg, FolderDisableSvg } from '../../components/icons';
import styles from './index.less';

const Doc: React.FC = () => {
  const wbIns = useMemo(() => {
    return whiteBoardFactory.getInstance('netease');
  }, []);
  const { enable: displayEnable } = useClassroomStore(state => state.display);
  const localPreviewing = useClassroomStore(
    state => state.localMedia.sources.length !== 0
  );
  const [tipOpen, setTipOpen] = useState(false);

  const disabledText = useMemo(() => {
    if (displayEnable) {
      return '结束屏幕共享后可使用';
    }
    if (localPreviewing) {
      return '关闭音视频画面后可恢复使用';
    }
    return '';
  }, [displayEnable, localPreviewing]);

  const openDocManager = useCallback(() => {
    if (!disabledText) {
      wbIns?.openUploadModal();
    }
  }, [disabledText]);

  return (
    <Popover
      content={disabledText}
      open={tipOpen}
      onOpenChange={bool => {
        setTipOpen(disabledText ? bool : false);
      }}
    >
      <div className={styles['button-wrapper']}>
        <div
          className={classNames(styles.button, {
            [styles.disabled]: !!disabledText,
          })}
          onClick={openDocManager}
        >
          {disabledText ? <FolderDisableSvg /> : <FolderSvg />}
          <div className={styles['button-text']}>课件</div>
        </div>
      </div>
    </Popover>
  );
};

export default Doc;
