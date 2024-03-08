import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { UserOutlinedSvg } from '@/components/ClassRoom/components/icons';
import { ClockCircleOutlined } from '@ant-design/icons';
import { CloseOutlined } from '@ant-design/icons';
import Countdown from '../../Countdown';
import CheckInHistoryModal from '../CheckInHistory';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { IMemberInfo } from '@/components/ClassRoom/types';
import styles from './index.less';

interface IProps {
  children?: React.ReactNode;
}

const CheckInTask: React.FC<IProps> = props => {
  const { services } = useContext(ClassContext);
  const { children } = props;
  const {
    classroomInfo: { id: classId, teacherId, assistantId },
    runningCheckIn,
    checkInRecords,
    setRunningCheckIn,
    setCheckInRecords,
  } = useClassroomStore();

  const [checkInHistoryModalOpened, setCheckInHistoryModalOpened] =
    useState(false);
  const [visible, setVisible] = useState(false);
  const [running, setRunning] = useState(false);
  const studentListRef = useRef<IMemberInfo[]>([]);
  const [studentList, setStudentList] = useState<IMemberInfo[] | undefined>();
  const fetchCheckInStatusInterval = useRef<number>(-1);

  const reset = () => {
    studentListRef.current = [];
  };

  const restTime = useMemo(() => {
    const { startTime, nowTime, duration } = runningCheckIn ?? {};
    return startTime && nowTime && duration
      ? (+new Date(startTime) + duration * 1000 - +new Date(nowTime)) / 1000
      : 0;
  }, [runningCheckIn]);

  const fetchCheckInStatus = async (checkInId: string) => {
    if (checkInId) {
      try {
        const res = await services?.getCheckInRecords(checkInId);
        if (res) setCheckInRecords(res ?? []);
      } catch (error) {
        setCheckInRecords([]);
      }
    }
  };

  useEffect(() => {
    if (restTime) {
      setVisible(restTime > 0);
      setRunning(restTime > 0);
      if (runningCheckIn?.id) {
        fetchCheckInStatusInterval.current = window.setInterval(() => {
          fetchCheckInStatus(runningCheckIn?.id);
        }, 2000);
        return () => {
          clearInterval(fetchCheckInStatusInterval.current);
        };
      }
    }
  }, [restTime, runningCheckIn]);

  const fetchRunningCheckIn = useCallback(async () => {
    if (classId) {
      try {
        const res = await services?.getRunningCheckIn(classId);
        setRunningCheckIn(res);
      } catch (error) {}
    }
  }, [classId]);

  // 获取所有学生
  const fetchStudentList = useCallback(
    async (pageNum = 1) => {
      try {
        const res = await services?.listMembers({
          class_id: classId,
          page_num: pageNum,
          page_size: 100,
          identity: 1, // 学生
          status: 0, // 所有状态
        });
        const { total, members } = res;
        studentListRef.current.push(...members);
        if (studentListRef.current.length < total) {
          fetchStudentList(pageNum + 1);
        } else {
          setStudentList(studentListRef.current);
        }
      } catch (error) {}
    },
    [teacherId, assistantId]
  );

  useEffect(() => {
    fetchRunningCheckIn();
  }, [fetchRunningCheckIn]);

  useEffect(() => {
    if (visible) fetchStudentList();
    return reset;
  }, [visible, fetchStudentList]);

  const handleCheckInEnd = useCallback(() => {
    setRunningCheckIn(undefined);
    setRunning(false);

    if (runningCheckIn?.id) {
      fetchCheckInStatus(runningCheckIn?.id);
      clearInterval(fetchCheckInStatusInterval.current);
    }
  }, [runningCheckIn]);

  if (visible)
    return (
      <>
        {children}
        <div className={styles['check-in-task']}>
          <div
            className={styles['check-in-task__users']}
            onClick={() => setCheckInHistoryModalOpened(true)}
          >
            <UserOutlinedSvg />
            {checkInRecords?.length ?? 0}
            <span className={styles['check-in-task__users__sum']}>
              /{studentList?.length ?? 0}
            </span>
          </div>
          {running ? (
            <div className={styles['check-in-task__countdown']}>
              <ClockCircleOutlined className={styles['icon-clock']} />
              <Countdown duration={restTime} onEnd={handleCheckInEnd} />
            </div>
          ) : (
            <CloseOutlined
              className={styles['check-in-task__icon-close']}
              onClick={() => setVisible(false)}
            />
          )}
        </div>
        <CheckInHistoryModal
          visible={checkInHistoryModalOpened}
          onClose={() => setCheckInHistoryModalOpened(false)}
        />
      </>
    );
  return null;
};

export default CheckInTask;
