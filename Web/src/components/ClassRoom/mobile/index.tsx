import React, { useContext, useState, useEffect } from 'react';
import useClassroomStore from '../store';
import { ClassContext } from '../ClassContext';
import { ClassroomModeEnum } from '../types/classroom';
import { ClassroomStatusEnum } from '../types';
import PublicClass from './publicClass';
import BigClass from './bigClass';
import { LeftOutlinedSvg } from '../components/icons';
import Icon from '@ant-design/icons';
import { usePageVisibilityListener } from '@/utils/hooks';
import styles from './index.less';

const MobileClassRoom: React.FC = () => {
  const { mode, status } = useClassroomStore(state => state.classroomInfo);
  const { exit } = useContext(ClassContext);
  const [exitIconVisible, setExitIconVisible] = useState<boolean>(true);

  useEffect(() => {
    if (status === ClassroomStatusEnum.ended) {
      setExitIconVisible(true);
    }
  }, [status]);

  const onBarVisibleChange = (bool: boolean) => {
    setExitIconVisible(bool);
  };

  // 学生端专注度检测
  usePageVisibilityListener({
    onVisible: () => {
      console.log('页面可见，上报专注度事件建议在这里执行');
    },
    onHidden: () => {
      console.log('页面不可见，上报专注度事件建议在这里执行');
    },
  });

  return (
    <div className={styles.h5wrap}>
      <div style={{ display: exitIconVisible ? 'block' : 'none' }}>
        <span className={styles['h5player__exit']} onClick={exit}>
          <Icon component={LeftOutlinedSvg} />
        </span>
      </div>

      <PublicClass
        active={mode === ClassroomModeEnum.Open}
        onBarVisibleChange={onBarVisibleChange}
      />
      <BigClass
        active={mode === ClassroomModeEnum.Big}
        onBarVisibleChange={onBarVisibleChange}
      />
    </div>
  );
};

export default MobileClassRoom;
