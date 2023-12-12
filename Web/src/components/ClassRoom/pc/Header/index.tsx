import React, {
  useState,
  useEffect,
  useMemo,
  Fragment,
  useContext,
} from 'react';
import toast from '@/utils/toast';
import useClassroomStore from '../../store';
import { ClassroomStatusEnum } from '../../types';
import { getTimeFormat, isValidDate } from '../../utils/common';
import copyText from '../../utils/copyText';
import {
  CopySvg,
  NotificationFilledSvg,
  ExitSvg,
} from '../../components/icons';
import { ClassContext } from '../../ClassContext';
import styles from './index.less';

const RoomStatus: React.FC = () => {
  const {
    isTeacher,
    classroomInfo: { status, startedAt },
    pusher: { pushing, startTime: pusherStartTime },
  } = useClassroomStore(state => state);
  const [startTime, setStartTime] = useState<Date>();
  const [currentTime, setCurrentTime] = useState(new Date());

  const started = useMemo(() => {
    if (status !== ClassroomStatusEnum.started) {
      return false;
    }
    // 老师角色时还需要 pushing 也为 ture
    if (isTeacher) {
      return pushing;
    }
    return true;
  }, [status, pushing, isTeacher]);

  useEffect(() => {
    if (status === ClassroomStatusEnum.started) {
      if (isTeacher) {
        // 当时老师时直接使用 pusher.startTime
        setStartTime(pusherStartTime);
      } else {
        // 其他情况，优先使用 classroomInfo.startedAt 更新推送状态，时间
        let time = startedAt ? new Date(startedAt) : new Date();
        time = isValidDate(time) ? time : new Date();
        setStartTime(time);
      }
    }
  }, [isTeacher, startedAt, pusherStartTime, status]);

  useEffect(() => {
    let timer: number;
    if (started) {
      timer = window.setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [started]);

  const wrapClassName = useMemo(
    () =>
      started ? styles['classroom-status--online'] : styles['classroom-status'],
    [started]
  );

  const text = useMemo(() => {
    if (started && startTime) {
      return getTimeFormat(currentTime, startTime);
    }
    if (status === ClassroomStatusEnum.ended) {
      return '课程已结束';
    }
    return '课程未开始';
  }, [status, started, currentTime, startTime]);

  return (
    <div className={wrapClassName}>
      <NotificationFilledSvg className={styles['classroom-status-svg']} />
      {text}
    </div>
  );
};

const RoomHeader: React.FC = () => {
  const {
    classroomInfo: { id },
    isTeacher,
  } = useClassroomStore(state => state);
  const { exit } = useContext(ClassContext);

  const copy = () => {
    const bool = copyText(id);
    if (bool) {
      toast.success('教室号复制成功');
    } else {
      toast.error('教室号复制失败');
    }
  };

  const renderRight = () => {
    if (isTeacher) {
      return null;
    }

    return (
      <div className={styles['pc-header-right']}>
        <span className={styles['pc-header-exit']} onClick={exit}>
          <ExitSvg /> 退出
        </span>
      </div>
    );
  };

  return (
    <div className={styles['pc-header']}>
      {id ? (
        <Fragment>
          <div className={styles['pc-id-block']}>
            <span>教室号: {id}</span>
            <CopySvg onClick={copy} />
          </div>
          <RoomStatus />

          {renderRight()}
        </Fragment>
      ) : null}
    </div>
  );
};

export default RoomHeader;
