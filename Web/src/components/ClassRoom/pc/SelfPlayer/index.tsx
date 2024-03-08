import React, { useContext, useMemo, useEffect } from 'react';
import classNames from 'classnames';
import { useDebounceFn } from 'ahooks';
import livePush from '../../utils/LivePush';
import { ClassContext } from '../../ClassContext';
import useClassroomStore from '../../store';
import { PreviewPlayerId } from '../../constants';
import {
  MicCloseSvg,
  MicNormalSvg,
  MicDisableSvg,
  CameraDisableSvg,
  CameraCloseSvg,
  CameraNormalSvg,
  CameraCloseSolidSvg,
  ViewSwitchSvg,
} from '../../components/icons';
import styles from './index.less';

interface ISelfPlayerProps {
  className?: string;
  switcherVisible?: boolean;
  onSwitchView?: () => void;
}

const SelfPlayer: React.FC<ISelfPlayerProps> = props => {
  const { className, switcherVisible = true, onSwitchView } = props;
  const { cameraEnable, cameraDisabled, micDisbaled, micEnable } =
    useClassroomStore(state => ({
      cameraEnable: state.camera.enable,
      cameraDisabled: state.camera.deviceCount <= 0,
      micDisbaled: state.microphone.deviceCount <= 0,
      micEnable: state.microphone.enable,
    }));
  const { switchScreen } = useContext(ClassContext);

  const { run: toggleMic } = useDebounceFn(
    () => {
      const { microphone, setMicrophoneEnable } = useClassroomStore.getState();
      if (microphone.deviceCount !== 0) {
        setMicrophoneEnable(!microphone.enable);
      }
    },
    { wait: 500, leading: true }
  );

  const { run: toggleCamera } = useDebounceFn(
    () => {
      const { camera, setCameraEnable } = useClassroomStore.getState();
      if (camera.deviceCount !== 0) {
        setCameraEnable(!camera.enable);
      }
    },
    { wait: 500, leading: true }
  );

  const renderIcon = (type: 'camera' | 'mic') => {
    let svg: any;
    if (type === 'camera') {
      svg = cameraDisabled ? (
        <CameraDisableSvg />
      ) : cameraEnable ? (
        <CameraNormalSvg />
      ) : (
        <CameraCloseSvg />
      );
    } else {
      svg = micDisbaled ? (
        <MicDisableSvg />
      ) : micEnable ? (
        <MicNormalSvg />
      ) : (
        <MicCloseSvg />
      );
    }

    return svg;
  };

  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);

  useEffect(() => {
    if (cameraEnable) {
      livePusher.startPreview(PreviewPlayerId);
    }
  }, [cameraEnable]);

  return (
    <div className={classNames(styles['self-player'], className)}>
      <video
        id={PreviewPlayerId}
        className={styles['self-player-video']}
        muted
      ></video>

      {cameraEnable ? null : (
        <div className={styles['self-player__camera-close']}>
          <CameraCloseSolidSvg />
        </div>
      )}

      <span className={styles['self-player__role']}>老师(我)</span>

      <div className={styles['self-player__actions']}>
        {switcherVisible ? (
          <div
            className={styles['self-player__action']}
            onClick={onSwitchView ?? switchScreen}
          >
            <ViewSwitchSvg />
          </div>
        ) : null}

        <div className={styles['self-player__actions__right']}>
          <span
            className={classNames(styles['self-player__action'], {
              [styles.disabled]: cameraDisabled,
            })}
            onClick={toggleCamera}
          >
            {renderIcon('camera')}
          </span>

          <span
            className={classNames(styles['self-player__action'], {
              [styles.disabled]: micDisbaled,
            })}
            onClick={toggleMic}
          >
            {renderIcon('mic')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SelfPlayer;
