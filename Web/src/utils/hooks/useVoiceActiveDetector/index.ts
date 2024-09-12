import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import AudioLevelMonitor from './audioLevelMonitor';
import toast from '@/utils/toast';
import { VOICE_ACTIVE_MIN_DURATION } from './constants';

interface IVoiceActiveDetectorProps {
  previewElementRef: React.RefObject<HTMLVideoElement>;
  userNick: string;
  onVoiceActive?: (active: boolean) => void; // 发言开始/结束
}

const useVoiceActiveDetector = ({
  previewElementRef,
  userNick,
  onVoiceActive,
}: IVoiceActiveDetectorProps) => {
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | undefined>();
  const audioLevelMonitor = useMemo(() => new AudioLevelMonitor(), []);

  const destoryToastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const toastKeyRef = useRef<number>();

  const previewMediaStream = previewElementRef?.current
    ?.srcObject as MediaStream;
  useEffect(() => {
    const { enabled, muted, readyState } =
      previewMediaStream?.getAudioTracks()?.[0] ?? {};
    if (enabled && !muted && readyState === 'live') {
      setAudioTrack(previewMediaStream?.getAudioTracks()?.[0]);
      return () => {
        setAudioTrack(undefined);
      };
    }
  }, [previewMediaStream?.getAudioTracks()?.[0]?.id]);

  // 与防抖相似
  const onAudioLevel = useCallback(() => {
    // 没有生效中的倒计时，说明当前非发言状态，无toast显示
    if (!destoryToastTimerRef.current) {
      const key = +Date.now();
      toast(`${userNick}正在发言`, {
        duration: 0, // 持续显示，销毁需要手动触发
        className: 'voice-active-toast',
        key,
      });
      toastKeyRef.current = key;

      onVoiceActive?.(true); // 开始发言
    } else {
      // 若已经有倒计时，则toast继续显示，清除前一次倒计时
      clearTimeout(destoryToastTimerRef.current);
    }

    // 重新设置倒计时
    const timer = setTimeout(() => {
      toast.destroy(toastKeyRef.current); // 清除toast
      toastKeyRef.current = undefined;

      clearTimeout(timer);
      destoryToastTimerRef.current = undefined;

      onVoiceActive?.(false); // 结束发言
    }, VOICE_ACTIVE_MIN_DURATION);

    destoryToastTimerRef.current = timer;
  }, [onVoiceActive]);

  useEffect(() => {
    if (audioTrack && audioLevelMonitor) {
      audioLevelMonitor.on('audioLevel', onAudioLevel);
      audioLevelMonitor.start(audioTrack, 200);

      return () => {
        audioLevelMonitor.off('audioLevel', onAudioLevel);
        audioLevelMonitor.dispose();

        if (destoryToastTimerRef.current) {
          clearTimeout(destoryToastTimerRef.current);
          destoryToastTimerRef.current = undefined;
        }

        if (toastKeyRef.current) {
          toast.destroy(toastKeyRef.current); // 清除toast
          toastKeyRef.current = undefined;
        }

        onVoiceActive?.(false); // 结束发言
      };
    }
  }, [audioTrack, audioLevelMonitor, onVoiceActive]);
};

export default useVoiceActiveDetector;
