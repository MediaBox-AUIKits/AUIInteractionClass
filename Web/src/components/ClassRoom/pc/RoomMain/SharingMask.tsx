import React from 'react';
import useClassroomStore from '../../store';
import { ScreenShareSvg } from '../../components/icons';
import styles from './styles.less';
import classNames from 'classnames';

interface ISharingMaskProps {
  minify?: boolean; // 屏幕共享作为次画面
  style?: React.CSSProperties;
}

const SharingMask: React.FC<ISharingMaskProps> = props => {
  const { enable } = useClassroomStore(state => state.display);

  if (!enable) {
    return null;
  }

  return (
    <div
      className={classNames(styles['sharing-mask'], {
        [styles.minify]: props.minify ?? false,
      })}
      style={props.style ?? {}}
    >
      <ScreenShareSvg />
      <span>屏幕共享中...</span>
    </div>
  );
};

export default SharingMask;
