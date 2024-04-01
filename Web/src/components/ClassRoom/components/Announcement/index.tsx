import React, {
  useState,
  useMemo,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { Modal, Button, Input } from 'antd';
import type { InputRef } from 'antd';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import toast from '@/utils/toast';
import styles from './index.less';

interface IProps {
  visible: boolean;
  initEditable?: boolean;
  onClose: () => void;
}

const Announcement: React.FC<IProps> = props => {
  const { visible, initEditable = false, onClose } = props;
  const { auiMessage, userInfo } = useContext(ClassContext);
  const { groupMeta } = useClassroomStore();

  const [modalOpened, setModalOpened] = useState<boolean>(visible);
  const inputRef = useRef<InputRef | null>(null);
  const [enteringAnnouncement, setEnteringAnnouncement] = useState('');
  const [editing, setEditing] = useState(initEditable);
  const confirmButton = useMemo(() => (editing ? '发布' : '编辑'), [editing]);

  useEffect(() => {
    setEnteringAnnouncement(groupMeta?.announcement?.content ?? '');
  }, [groupMeta?.announcement]);

  useEffect(() => {
    setModalOpened(visible);

    if (visible && !enteringAnnouncement) {
      setEditing(true);
    }
  }, [visible, enteringAnnouncement]);

  const closeModal = useCallback(() => {
    setModalOpened(false);
    onClose?.();
  }, [onClose]);

  const handleUpdateAnnouncement = useCallback(async () => {
    await auiMessage.modifyGroup({
      groupMeta: JSON.stringify({
        ...groupMeta,
        announcement: {
          content: enteringAnnouncement,
          modifyTime: +Date.now(),
          modifyUserId: userInfo?.userId,
        },
      }),
    });
    toast('公告已发布', { type: 'success' });
    closeModal();
  }, [enteringAnnouncement, userInfo, groupMeta, closeModal]);

  const handleConfirm = useCallback(() => {
    if (editing) {
      handleUpdateAnnouncement();
    } else {
      setEditing(true);
    }
  }, [editing, handleUpdateAnnouncement]);

  useEffect(() => {
    if (!modalOpened) {
      setEditing(initEditable);
      setEnteringAnnouncement(groupMeta?.announcement?.content ?? '');
    }
  }, [initEditable, modalOpened, groupMeta?.announcement]);

  useEffect(() => {
    if (editing && modalOpened)
      inputRef.current?.focus({
        cursor: 'end',
      });
  }, [editing, modalOpened]);

  return (
    <Modal
      open={modalOpened}
      title="公告"
      width={514}
      centered
      keyboard={false}
      maskClosable={false}
      footer={
        <>
          <span className={styles['announcement-modal__footer__actions']}>
            <Button
              type="primary"
              disabled={enteringAnnouncement.trim() === '' && editing}
              onClick={handleConfirm}
            >
              {confirmButton}
            </Button>
            <Button onClick={closeModal}>取消</Button>
          </span>
        </>
      }
      onCancel={closeModal}
    >
      <Input.TextArea
        className={styles['announcement-modal__textarea']}
        ref={inputRef}
        rows={6}
        disabled={!editing}
        showCount
        maxLength={120}
        placeholder="请输入教室公告内容"
        value={enteringAnnouncement}
        onChange={val => setEnteringAnnouncement(val.target.value)}
      />
    </Modal>
  );
};

export default Announcement;
