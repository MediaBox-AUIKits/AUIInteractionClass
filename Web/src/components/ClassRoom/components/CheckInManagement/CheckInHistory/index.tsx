import React, {
  useState,
  useRef,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { Modal, Button } from 'antd';
import EmptyBlock from '../../EmptyBlock';
import { LoadingOutlined } from '@ant-design/icons';
import useClassroomStore from '@/components/ClassRoom/store';
import {
  IMemberInfo,
  MemberStatus,
  StudentCheckInRecord,
} from '@/components/ClassRoom/types';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import styles from './index.less';
import classNames from 'classnames';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

const CheckInHistory: React.FC<IProps> = props => {
  const { visible, onClose } = props;
  const { services } = useContext(ClassContext);
  const {
    classroomInfo: { id: classId, teacherId, assistantId },
    checkInRecords,
    setCheckInRecords,
  } = useClassroomStore();
  const [modalOpened, setModalOpened] = useState<boolean>(visible);

  const [loading, setLoading] = useState(false);
  const studentListRef = useRef<IMemberInfo[]>([]);
  const [studentList, setStudentList] = useState<IMemberInfo[] | undefined>();
  const [checkedInMembers, setCheckedInMembers] = useState<IMemberInfo[]>([]);
  const [notCheckedInMembers, setNotCheckedInMembers] = useState<IMemberInfo[]>(
    []
  );
  const [noLastCheckIn, setNoLastCheckIn] = useState(false);

  const reset = () => {
    studentListRef.current = [];
    setStudentList(undefined);
    setCheckedInMembers([]);
    setNotCheckedInMembers([]);
    setNoLastCheckIn(false);
    setLoading(false);
  };

  useEffect(() => {
    setModalOpened(visible);
    if (!visible) reset();
  }, [visible]);

  const closeModal = useCallback(() => {
    setModalOpened(false);
    onClose?.();
  }, [onClose]);

  const fetchLastCheckInRecords = useCallback(async () => {
    const checkInList = await services?.getAllCheckIns(classId);
    const lastCheckIn = checkInList
      ? checkInList[checkInList.length - 1]
      : undefined;
    setNoLastCheckIn(!lastCheckIn);
    if (lastCheckIn?.id) {
      try {
        const res = await services?.getCheckInRecords(lastCheckIn?.id);
        setCheckInRecords(res ?? []);
      } catch (error) {
        setCheckInRecords([]);
      }
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
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchStudentList();
        await fetchLastCheckInRecords();
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    if (visible) {
      fetchData();
    }
  }, [fetchLastCheckInRecords, visible]);

  useEffect(() => {
    if (studentList) {
      let [checked, notChecked] = [[], []] as [IMemberInfo[], IMemberInfo[]];
      studentList.forEach(item => {
        const isCheckedIn =
          ((checkInRecords ?? []) as StudentCheckInRecord[]).findIndex(
            record => record.userId === item.userId
          ) > -1;
        if (isCheckedIn) {
          checked.push(item);
        } else {
          notChecked.push(item);
        }
      });

      setCheckedInMembers(checked);
      setNotCheckedInMembers(notChecked);
    }
  }, [checkInRecords, studentList]);

  return (
    <Modal
      open={modalOpened}
      title="历史签到记录"
      width={640}
      centered
      keyboard={false}
      maskClosable={false}
      footer={<Button onClick={closeModal}>关闭</Button>}
      onCancel={closeModal}
      bodyStyle={{ padding: 0 }}
    >
      <div className={styles['check-in-history__wrapper']}>
        {noLastCheckIn ? (
          <EmptyBlock center text={'无历史签到'} />
        ) : (
          <div className={styles['check-in-history']}>
            <div className={styles.list}>
              <div className={styles['list__title']}>
                未签到（{notCheckedInMembers.length}）
              </div>
              {loading ? (
                <LoadingOutlined className={styles['list__loading']} />
              ) : (
                <div className={styles['list__body']}>
                  {notCheckedInMembers.map(({ userId, userName, status }) => (
                    <div className={styles['list__body__item']} key={userId}>
                      {userName}
                      {status === MemberStatus.kicked ? (
                        <span
                          className={classNames(
                            styles['list__body__item__tag'],
                            styles['list__body__item__tag__kicked']
                          )}
                        >
                          被移除
                        </span>
                      ) : null}
                      {status === MemberStatus.offline ? (
                        <span
                          className={classNames(
                            styles['list__body__item__tag'],
                            styles['list__body__item__tag__leave']
                          )}
                        >
                          离开
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.list}>
              <div className={styles['list__title']}>
                已签到（{checkedInMembers.length}）
              </div>
              {loading ? (
                <LoadingOutlined className={styles['list__loading']} />
              ) : (
                <div className={styles['list__body']}>
                  {checkedInMembers.map(({ userId, userName, status }) => (
                    <div className={styles['list__body__item']} key={userId}>
                      {userName}
                      {status === MemberStatus.kicked ? (
                        <span
                          className={classNames(
                            styles['list__body__item__tag'],
                            styles['list__body__item__tag__kicked']
                          )}
                        >
                          被移除
                        </span>
                      ) : null}
                      {status === MemberStatus.offline ? (
                        <span
                          className={classNames(
                            styles['list__body__item__tag'],
                            styles['list__body__item__tag__leave']
                          )}
                        >
                          离开
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CheckInHistory;
