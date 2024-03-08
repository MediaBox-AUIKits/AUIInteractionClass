import React, { useContext } from 'react';
import { ViewSwitchSvg } from '../icons';
import { ClassContext } from '../../ClassContext';
import styles from './index.less';

interface IPCAsideScreenWrapperProps {
  children: React.ReactElement;
  switcherVisible: boolean;
  onSwitchView?: () => void;
}

const PCAsideScreenWrapper: React.FC<IPCAsideScreenWrapperProps> = props => {
  const { children, switcherVisible = false, onSwitchView } = props;
  const { switchScreen } = useContext(ClassContext);

  return (
    <div className={styles['aside-screen-wrapper']}>
      {children}

      {switcherVisible ? (
        <div className={styles['aside-screen-wrapper__bottom']}>
          <div
            className={styles['aside-screen-wrapper__action']}
            onClick={onSwitchView ?? switchScreen}
          >
            <ViewSwitchSvg />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PCAsideScreenWrapper;
