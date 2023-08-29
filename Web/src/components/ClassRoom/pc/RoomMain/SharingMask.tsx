import React from 'react';
import useClassroomStore from '../../store';
import { ScreenShareSvg } from '../../components/icons';
import styles from './styles.less';

const SharingMask: React.FC = () => {
  const { enable } = useClassroomStore(state => state.display);

  if (!enable) {
    return null;
  }

  return (
    <div className={styles['sharing-mask']}>
      <ScreenShareSvg />
      <span>屏幕共享中...</span>
    </div>
  );
};

export default SharingMask;
