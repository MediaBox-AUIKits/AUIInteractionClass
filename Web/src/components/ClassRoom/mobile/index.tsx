import React, { useContext, useState, useEffect, useMemo } from 'react';
import useClassroomStore from '../store';
import { ClassContext } from '../ClassContext';
import { ClassroomModeEnum } from '../types/classroom';
import { ClassroomStatusEnum } from '../types';
import PublicClass from './publicClass';
import BigClass from './bigClass';
import { LeftOutlineSvg } from '../components/icons';
import Icon from '@ant-design/icons';
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

  return (
    <div className={styles.h5wrap}>
      <div style={{ display: exitIconVisible ? 'block' : 'none' }}>
        <span className={styles['h5player__exit']} onClick={exit}>
          <Icon component={LeftOutlineSvg} />
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
