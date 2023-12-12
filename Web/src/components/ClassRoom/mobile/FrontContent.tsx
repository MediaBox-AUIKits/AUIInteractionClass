import React, { useRef, useEffect, Fragment } from 'react';
import useClassroomStore from '../store';
import { ClassroomStatusEnum } from '../types';
import { ClassStatusTips } from '../constants';
import NeteaseBoard from '../components/Whiteboard/NeteaseBoard';
import styles from './FrontContent.less';

interface IFrontContentProps {
  hasWhiteBoard?: boolean;
  onControlVisibleChange?: (bool: boolean) => void;
  children?: React.ReactNode;
}

const FrontContent: React.FC<IFrontContentProps> = props => {
  const { hasWhiteBoard = true, onControlVisibleChange, children } = props;
  const { status } = useClassroomStore(state => state.classroomInfo);
  const timer = useRef<NodeJS.Timeout>();

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  };

  const startTimer = () => {
    clearTimer();
    // 5秒后通知上层隐藏退出按键等
    timer.current = setTimeout(() => {
      onControlVisibleChange && onControlVisibleChange(false);
    }, 5000);
  };

  const handleWrapClick = () => {
    // 用于通知上层是否需要显示退出按键
    onControlVisibleChange && onControlVisibleChange(true);
    startTimer();
  };

  useEffect(() => {
    if (status === ClassroomStatusEnum.started) {
      // 变为上课中时需要触发 timer，自动隐藏退出按键等
      startTimer();
    } else {
      clearTimer();
    }
  }, [status]);

  return (
    <div className={styles['front-content']}>
      {status !== ClassroomStatusEnum.started ? (
        <p className={styles['front-content__tip']}>
          {ClassStatusTips[status]}
        </p>
      ) : (
        <Fragment>
          <div className={styles['whiteboard-wrap']} onClick={handleWrapClick}>
            {hasWhiteBoard ? <NeteaseBoard /> : null}
          </div>

          {children ? (
            <div className={styles['player-overlay']}>{children}</div>
          ) : null}
        </Fragment>
      )}
    </div>
  );
};

export default FrontContent;
