import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Modal, Button, InputNumber, Form, Radio } from 'antd';
import CheckInHistoryModal from './CheckInHistory';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { CustomMessageTypes } from '../../types/message';
import styles from './index.less';
import toast from '@/utils/toast';

type Duration = number | 'custom';

const DurationOptions: Array<{ label: string; value: Duration }> = [
  {
    label: '30秒',
    value: 30,
  },
  {
    label: '1分钟',
    value: 60,
  },
  {
    label: '2分钟',
    value: 120,
  },
  {
    label: '自定义时长',
    value: 'custom',
  },
];

interface IProps {
  visible: boolean;
  onClose: () => void;
}

const CheckInManagement: React.FC<IProps> = props => {
  const { visible, onClose } = props;
  const { auiMessage, services } = useContext(ClassContext);
  const { setRunningCheckIn, setCheckInRecords } = useClassroomStore();

  const [modalOpened, setModalOpened] = useState<boolean>(visible);
  const [checkInHistoryModalOpened, setCheckInHistoryModalOpened] =
    useState(false);
  const [duration, setDuration] = useState<Duration | undefined>(
    DurationOptions[0].value
  );
  const [loading, setLoading] = useState(false);
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  useEffect(() => {
    setModalOpened(visible);
  }, [visible]);

  const closeModal = useCallback(() => {
    setModalOpened(false);
    onClose?.();
  }, [onClose]);

  const handleTriggerCheckIn = useCallback(async () => {
    if (typeof duration === 'number') {
      try {
        const checkInInfo = await services?.setCheckIn(duration);
        auiMessage.sendGroupSignal({
          type: CustomMessageTypes.CheckInStarted,
        });
        setRunningCheckIn(checkInInfo);
        setCheckInRecords([]);
      } catch (error: any) {
        if (error.message === 'AlreadyCheckIn') {
          toast.warning('当前有正在进行的签到，请稍后设置');
        }
        if (error.message === 'NotPermit') {
          toast.warning('您没有设置签到的权限，请联系管理员');
        }
      }
    }
  }, [duration]);

  const handleConfirm = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    await handleTriggerCheckIn();
    closeModal();
    setLoading(false);
  }, [handleTriggerCheckIn, closeModal, loading]);

  const handleChangeDuration = (value: Duration) => {
    if (value === 'custom') {
      setDuration(undefined);
    } else {
      setDuration(value);
    }
    setIsCustomDuration(value === 'custom');
  };

  return (
    <>
      <Modal
        open={modalOpened}
        title="签到"
        width={640}
        centered
        keyboard={false}
        maskClosable={false}
        footer={
          <>
            <span
              className={styles['checkIn-management-modal__footer__actions']}
            >
              <Button
                type="primary"
                disabled={!duration || loading}
                onClick={handleConfirm}
              >
                确定
              </Button>
              <Button onClick={closeModal}>取消</Button>
            </span>
          </>
        }
        onCancel={closeModal}
      >
        <Form
          labelAlign="left"
          colon={false}
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 15 }}
        >
          <Form.Item label="签到时限">
            <Radio.Group defaultValue={duration} optionType="button">
              {DurationOptions.map(({ label, value }) => (
                <Radio
                  key={value}
                  value={value}
                  onClick={() => handleChangeDuration(value)}
                >
                  {label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          {isCustomDuration ? (
            <Form.Item
              label="自定义时长"
              validateTrigger="onBlur"
              rules={[
                { max: 600, min: 10, message: '自定义时长范围：10~600秒' },
              ]}
            >
              <InputNumber
                style={{ width: 128 }}
                min={10}
                max={600}
                onChange={(val: number | null) => setDuration(val ?? 0)}
              />
              <span className={styles.unit}>秒</span>
            </Form.Item>
          ) : null}
        </Form>
        <Button
          className={styles.link}
          type="link"
          onClick={() => setCheckInHistoryModalOpened(true)}
        >
          历史签到记录
        </Button>
      </Modal>
      <CheckInHistoryModal
        visible={checkInHistoryModalOpened}
        onClose={() => setCheckInHistoryModalOpened(false)}
      />
    </>
  );
};

export default CheckInManagement;
