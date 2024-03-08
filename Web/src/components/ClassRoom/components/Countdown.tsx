import React, { useRef, useState, useEffect } from 'react';
import { getDisplayBySeconds } from '@/components/ClassRoom/utils/common';

interface IProps {
  className?: string;
  duration: number; // 秒
  onEnd: () => void; // 倒计时结束
}

const Countdown: React.FC<IProps> = props => {
  const { className = '', duration, onEnd } = props;
  const rest = useRef(duration);
  const [time, setTime] = useState<{ min: string; sec: string } | undefined>();

  useEffect(() => {
    if (duration > 0) {
      const { min, sec } = getDisplayBySeconds(rest.current);
      setTime({ min, sec });

      rest.current = duration;
      const interval = window.setInterval(() => {
        rest.current--;
        const { min, sec } = getDisplayBySeconds(rest.current);
        setTime({ min, sec });
      }, 1000);

      const timer = window.setTimeout(() => {
        clearInterval(interval);
        onEnd();
      }, duration * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [duration]);

  if (time?.min && time?.sec)
    return (
      <span className={className}>
        {time?.min}:{time?.sec}
      </span>
    );
};

export default Countdown;
