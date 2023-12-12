import React, { Fragment } from 'react';
import { ClassroomStatusEnum } from '../../types';
import useClassroomStore from '../../store';
import {
  MicCloseSvg,
  MicNormalSvg,
  ViewSwitchSvg,
} from '../../components/icons';
import styles from './index.less';

interface IAsidePlayerProps {
  children: React.ReactElement;
  micOpened: boolean;
  switcherVisible: boolean;
  onSwitchView?: () => void;
}

const AsidePlayer: React.FC<IAsidePlayerProps> = props => {
  const {
    children,
    micOpened,
    switcherVisible,
    onSwitchView = () => {},
  } = props;
  const controlsVisible = useClassroomStore(
    state => state.classroomInfo.status === ClassroomStatusEnum.started
  );

  return (
    <div className={styles['audience-aside-player']}>
      {children}

      {controlsVisible ? (
        <Fragment>
          <div className={styles['audience-aside-player__role']}>主讲</div>

          <div className={styles['audience-aside-player__bottom']}>
            {switcherVisible ? (
              <div
                className={styles['audience-aside-player__bottom__action']}
                onClick={onSwitchView}
              >
                <ViewSwitchSvg />
              </div>
            ) : null}

            <div className={styles['audience-aside-player__bottom__right']}>
              <div className={styles['audience-aside-player__bottom__item']}>
                {micOpened ? <MicNormalSvg /> : <MicCloseSvg />}
              </div>
            </div>
          </div>
        </Fragment>
      ) : null}
    </div>
  );
};

export default AsidePlayer;
