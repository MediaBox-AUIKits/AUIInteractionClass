import React, { useState, useMemo, useEffect, useRef } from 'react';
import classNames from 'classnames';
import MicIcon from './MicIcon';
import { ISpectatorInfo } from '../../types';
import livePush from '../../utils/LivePush';
import useVoiceActiveDetector from '@/utils/hooks/useVoiceActiveDetector';
import styles from './index.less';

interface MemberProps extends ISpectatorInfo {
  onUserLeft: (userId: string) => void;
  wrapClassName?: string;
}

const Member: React.FC<MemberProps> = (props: MemberProps) => {
  const { userId, userNick, rtcPullUrl, micOpened, wrapClassName, onUserLeft } =
    props;

  const player = useMemo(() => livePush.createPlayerInstance(), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pulling, setPulling] = useState(false);

  const [voiceActive, setVoiceActive] = useState(false);

  useVoiceActiveDetector({
    previewElementRef: videoRef,
    userNick,
    onVoiceActive: setVoiceActive,
  });

  useEffect(() => {
    if (player && rtcPullUrl && videoRef.current && !pulling) {
      const startPlay = async () => {
        try {
          const playInfo = await player.startPlay(
            rtcPullUrl,
            videoRef.current!,
          );
          playInfo.on('userleft', () => {
            onUserLeft(userId);
          });
          setPulling(true);
        } catch (error) {
          console.log(error);
        }
      };
      startPlay();
    }
  }, [player, pulling, rtcPullUrl, userId]);

  useEffect(() => {
    if (pulling && player) {
      return () => {
        player.destroy();
      };
    }
  }, [player, pulling]);

  return (
    <div
      className={classNames(styles['interaction-player'], wrapClassName, {
        [styles['active']]: voiceActive,
      })}
    >
      <video ref={videoRef} controls={false} />
      <div className={styles['interaction-player__bottom']}>
        <div className={styles['interaction-player__info']}>
          <MicIcon closed={!micOpened ?? false} disabled={false}></MicIcon>
          <span className={styles['interaction-player__info__name']}>
            {userNick}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Member;
