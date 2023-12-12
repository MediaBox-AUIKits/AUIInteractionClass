import React, { useState, useMemo, useCallback } from 'react';
import { Popover } from 'antd';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import whiteBoardFactory from '../../utils/whiteboard';
import { BoardSvg, BoardDisableSvg } from '../../components/icons';
import styles from './index.less';

interface IProps {
  disabled?: boolean;
}

const Board: React.FC<IProps> = props => {
  const { disabled: propDisabled = false } = props;
  const wbIns = whiteBoardFactory.getInstance('netease');
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

  const disabled: boolean = useMemo(
    () => !!(disabledText || propDisabled),
    [disabledText, propDisabled]
  );

  const switchToBoard = useCallback(() => {
    if (!disabled) {
      const { boardNames = [] } = wbIns?.getBoardInfos() ?? {};
      // 简单用「白板」或「whiteboard」开头的字符串来筛选白板
      const firstWhiteboard = boardNames.find(boardName =>
        /^(白板|whiteboard)/i.test(boardName)
      );
      if (firstWhiteboard) {
        wbIns?.switchToBoard(firstWhiteboard);
      } else {
        wbIns?.addBoard('白板');
      }
    }
  }, [disabled, wbIns]);

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
            [styles.disabled]: disabled,
          })}
          onClick={switchToBoard}
        >
          {disabled ? <BoardDisableSvg /> : <BoardSvg />}
          <div className={styles['button-text']}>白板</div>
        </div>
      </div>
    </Popover>
  );
};

export default Board;
