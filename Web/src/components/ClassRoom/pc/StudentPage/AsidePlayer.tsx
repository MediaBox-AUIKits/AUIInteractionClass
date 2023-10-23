import React, { Fragment } from 'react';
import { ClassroomStatusEnum } from '../../types';
import useClassroomStore from '../../store';
import {
  MicCloseSvg,
  MicNormalSvg,
  ViewSwitchSvg,
} from '../../components/icons';
import styles from './styles.less';

interface IAsidePlayerProps {
  children: React.ReactElement;
  micOpened: boolean;
  onSwitchView: () => void;
}

const AsidePlayer: React.FC<IAsidePlayerProps> = props => {
  const { children, micOpened, onSwitchView } = props;
  const controlsVisible = useClassroomStore(
    state => state.classroomInfo.status === ClassroomStatusEnum.started
  );
  const interacting = useClassroomStore(state => state.interacting);

  return (
    <div className={styles['student-aside-player']}>
      {children}

      {controlsVisible ? (
        <Fragment>
          <div className={styles['student-aside-player__role']}>主讲</div>

          <div className={styles['student-aside-player__bottom']}>
            {interacting ? null : (
              <div
                className={styles['student-aside-player__bottom__action']}
                onClick={onSwitchView}
              >
                <ViewSwitchSvg />
              </div>
            )}

            <div className={styles['student-aside-player__bottom__right']}>
              <div className={styles['student-aside-player__bottom__item']}>
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
