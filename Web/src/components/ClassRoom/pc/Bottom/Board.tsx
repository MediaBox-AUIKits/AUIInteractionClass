import React, { useState, useMemo, useCallback } from 'react';
import { Popover } from 'antd';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import whiteBoardFactory from '../../utils/whiteboard';
import { BoardSvg, BoardDisableSvg } from '../../components/icons';
import styles from './index.less';

const Board: React.FC = () => {
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

  const switchToBoard = useCallback(() => {
    if (!disabledText) {
      wbIns?.switchToBoard();
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
          onClick={switchToBoard}
        >
          {disabledText ? <BoardDisableSvg /> : <BoardSvg />}
          <div className={styles['button-text']}>白板</div>
        </div>
      </div>
    </Popover>
  );
};

export default Board;
