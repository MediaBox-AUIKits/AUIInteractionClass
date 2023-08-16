import React, { useState, useMemo, useCallback } from 'react';
import { Popover } from 'antd';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import whiteBoardFactory from '../../utils/whiteboard';
import { BoardSvg } from '../../components/icons';
import styles from './index.less';

const Board: React.FC = () => {
  const wbIns = useMemo(() => {
    return whiteBoardFactory.getInstance('netease');
  }, []);
  const { enable: displayEnable } = useClassroomStore(state => state.display);
  const [tipOpen, setTipOpen] = useState(false);

  const switchToBoard = useCallback(() => {
    if (!displayEnable) {
      wbIns?.switchToBoard();
    }
  }, [displayEnable]);

  return (
    <Popover
      content="结束共享后可使用"
      open={tipOpen}
      onOpenChange={bool => {
        setTipOpen(displayEnable ? bool : false);
      }}
    >
      <div className={styles['button-wrapper']}>
        <div
          className={classNames(styles.button, {
            [styles.disabled]: displayEnable,
          })}
          onClick={switchToBoard}
        >
          <BoardSvg />
          <div className={styles['button-text']}>白板</div>
        </div>
      </div>
    </Popover>
  );
};

export default Board;
