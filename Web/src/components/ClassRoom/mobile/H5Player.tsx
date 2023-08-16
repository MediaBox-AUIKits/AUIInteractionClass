import React, { useContext, useState, useEffect } from 'react';
import Icon from '@ant-design/icons';
import Player from '../components/Player';
import useClassroomStore from '../store';
import { LeftOutlineSvg } from '../components/icons';
import { ClassContext } from '../ClassContext';
import { ClassroomStatusEnum } from '../types';
import styles from './H5Player.less';

const H5Room: React.FC = () => {
  const { exit } = useContext(ClassContext);
  const [barVisible, setBarVisible] = useState<boolean>(true);
  const { status } = useClassroomStore(state => state.classroomInfo);

  useEffect(() => {
    if (status === ClassroomStatusEnum.ended) {
      setBarVisible(true);
    }
  }, [status]);

  const onBarVisibleChange = (bool: boolean) => {
    setBarVisible(bool);
  };

  return (
    <div className={styles.h5player}>
      <Player
        wrapClassName={styles['h5player-container']}
        device="mobile"
        onBarVisibleChange={onBarVisibleChange}
        onError={() => setBarVisible(true)}
      />

      <div style={{ display: barVisible ? 'block' : 'none' }}>
        <span className={styles['h5player__exit']} onClick={exit}>
          <Icon component={LeftOutlineSvg} />
        </span>
      </div>
    </div>
  );
};

export default H5Room;
