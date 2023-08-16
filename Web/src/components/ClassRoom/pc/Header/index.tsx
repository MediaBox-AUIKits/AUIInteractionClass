import React, {
  useState,
  useEffect,
  useMemo,
  Fragment,
  useContext,
} from 'react';
import { message } from 'antd';
import useClassroomStore from '../../store';
import { ClassroomStatusEnum } from '../../types';
import { getTimeFormat } from '../../utils/common';
import copyText from '../../utils/copyText';
import { CopySvg, NotificationFilledSvg } from '../../components/icons';
import { ClassContext } from '../../ClassContext';
import styles from './index.less';

const RoomStatus: React.FC = () => {
  const { status } = useClassroomStore(state => state.classroomInfo);
  const { pushing, startTime } = useClassroomStore(state => state.pusher);
  const [currentTime, setCurrentTime] = useState(new Date());

  const started = useMemo(
    () => status === ClassroomStatusEnum.started && pushing,
    [status, pushing]
  );

  useEffect(() => {
    let timer: NodeJS.Timer;
    if (started) {
      timer = setInterval(() => {
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
  const { id } = useClassroomStore(state => state.classroomInfo);
  const { exit } = useContext(ClassContext);

  const copy = () => {
    const bool = copyText(id);
    if (bool) {
      message.success('教室号复制成功');
    } else {
      message.error('教室号复制失败');
    }
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
        </Fragment>
      ) : null}
    </div>
  );
};

export default RoomHeader;
