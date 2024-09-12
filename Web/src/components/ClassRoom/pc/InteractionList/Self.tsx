import React, { useMemo, useEffect, useContext, useState, useRef } from 'react';
import classNames from 'classnames';
import MicIcon from './MicIcon';
import { CameraCloseSolidSvg } from '../../components/icons';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import livePush from '../../utils/LivePush';
import useVoiceActiveDetector from '@/utils/hooks/useVoiceActiveDetector';
import styles from './index.less';

const SelfPlayerID = 'selfCardPlayer';

interface ISelfProps {
  wrapClassName?: string;
}

const Self: React.FC<ISelfProps> = props => {
  const { wrapClassName } = props;
  const {
    isTeacher,
    isStudent,
    interacting,
    camera: { enable: cameraEnable },
    microphone: { enable: micEnable, deviceCount: micDeviceCount },
  } = useClassroomStore(state => state);
  const { userInfo } = useContext(ClassContext);
  const micDisabled = micDeviceCount <= 0;

  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);

  useEffect(() => {
    if (isStudent && livePusher) {
      livePusher.startPreview(SelfPlayerID);
    }
  }, [isStudent, livePusher]);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  useVoiceActiveDetector({
    previewElementRef: previewVideoRef,
    userNick: '我',
    onVoiceActive: setVoiceActive,
  });

  if (isTeacher && !interacting) return null;

  return (
    <div
      className={classNames(styles['interaction-player'], wrapClassName, {
        [styles['active']]: voiceActive,
      })}
    >
      <video id={SelfPlayerID} ref={previewVideoRef} muted controls={false} />
      {cameraEnable ? null : (
        <div className={styles['interaction-player__camera-closed']}>
          <CameraCloseSolidSvg />
        </div>
      )}
      <div className={styles['interaction-player__bottom']}>
        <div className={styles['interaction-player__tag']}>我</div>
        <div className={styles['interaction-player__info']}>
          <MicIcon closed={!micEnable} disabled={micDisabled}></MicIcon>
          <span className={styles['interaction-player__info__name']}>
            {userInfo?.userName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Self;
