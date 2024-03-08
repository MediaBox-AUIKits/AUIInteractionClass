import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { Dialog } from 'antd-mobile';
import Countdown from '../Countdown';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { UA } from '@/utils/common';
import { CustomMessageTypes } from '../../types/message';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import toast from '@/utils/toast';

const StudentCheckIn: React.FC = () => {
  const { auiMessage, userInfo, services } = useContext(ClassContext);
  const {
    runningCheckIn,
    classroomInfo: { id: classId },
    setRunningCheckIn,
  } = useClassroomStore();
  const [modal, contextHolder] = Modal.useModal();
  const checkInModal = useRef<
    | {
        destroy: () => void;
      }
    | undefined
  >();
  const checkedIn = useRef<boolean | undefined>();

  // 组件初始化即获取当前签到
  const fetchRunningCheckIn = async (classId: string) => {
    if (classId) {
      try {
        const res = await services?.getRunningCheckIn(classId);
        setRunningCheckIn(res);
      } catch (error) {}
    }
  };

  useEffect(() => {
    fetchRunningCheckIn(classId);
  }, [classId]);

  const handleReceivedMessage = useCallback(
    (eventData: any) => {
      const { type } = eventData || {};
      switch (type) {
        // 收到签到开始的消息，立即获取当前签到
        case CustomMessageTypes.CheckInStarted:
          fetchRunningCheckIn(classId);
          checkedIn.current = false;
          break;
        default:
          break;
      }
    },
    [classId]
  );

  useEffect(() => {
    auiMessage.addListener(
      AUIMessageEvents.onMessageReceived,
      handleReceivedMessage
    );
    return () => {
      auiMessage.removeListener(
        AUIMessageEvents.onMessageReceived,
        handleReceivedMessage
      );
    };
  }, [auiMessage, handleReceivedMessage]);

  useEffect(() => {
    if (runningCheckIn?.id) {
      const fetchCurrentCheckInRecord = async (
        checkInId: string,
        userId: string
      ) => {
        try {
          const res = await services?.getCheckInRecordByUserId(
            checkInId,
            userId
          );
          checkedIn.current = !!res;
        } catch (error) {
          console.log(error);
          checkedIn.current = false;
        }
      };
      fetchCurrentCheckInRecord(runningCheckIn?.id, userInfo?.userId ?? '');
    }
  }, [runningCheckIn, userInfo]);

  const closeModal = () => {
    if (UA.isPC) {
      checkInModal.current?.destroy();
    } else {
      Dialog.clear();
    }
  };

  const handleCheckInEnded = () => {
    if (checkedIn.current) return;
    closeModal();
    toast.error('签到已结束，您未签到！');
  };

  const checkIn = useCallback(async () => {
    if (runningCheckIn?.id && userInfo?.userId) {
      try {
        await services?.checkIn(runningCheckIn?.id, userInfo?.userId);
        toast.success('签到成功');
        checkedIn.current = true;
      } catch (error: any) {
        toast.error(
          error.message === 'AlreadyCheckIn'
            ? '已签到，无需再次签到'
            : '签到失败'
        );
      }
    }
  }, [userInfo, runningCheckIn]);

  useEffect(() => {
    if (!runningCheckIn || checkedIn.current !== false) {
      return;
    }

    const { startTime, nowTime, duration } = runningCheckIn ?? {};
    if (!startTime || !nowTime || !duration) return;

    const restTime: number =
      (+new Date(startTime) + duration * 1000 - +new Date(nowTime)) / 1000;

    if (restTime <= 0) return;

    if (UA.isPC) {
      checkInModal.current = modal.info({
        title: (
          <>
            开始签到
            <Countdown duration={restTime} onEnd={handleCheckInEnded} />
          </>
        ),
        content: '请在规定时间内完成签到',
        onOk: checkIn,
      });
    } else {
      Dialog.alert({
        title: (
          <>
            开始签到
            <Countdown duration={restTime} onEnd={handleCheckInEnded} />
          </>
        ),
        content: '请在规定时间内完成签到',
        onConfirm: checkIn,
      });
    }
  }, [runningCheckIn, checkedIn.current]);

  useEffect(() => {
    return closeModal;
  }, []);

  return <>{contextHolder}</>;
};

export default StudentCheckIn;
