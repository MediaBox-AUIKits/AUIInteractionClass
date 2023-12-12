import { useRef, useEffect, useMemo, Fragment } from 'react';
import { Button, Modal, Popover, notification } from 'antd';
import useClassroomStore from '../../../store';
import livePush from '../../../utils/LivePush';
import logger, { EMsgid } from '../../../utils/Logger';
import {
  ClassroomStatusEnum,
  PermissionVerificationProps,
} from '../../../types';
import styles from './index.less';

export default function PushButton(props: PermissionVerificationProps) {
  const { noPermission = false, noPermissionNotify } = props;
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const [modal, contextHolder] = Modal.useModal();
  const [notice, noticeHolder] = notification.useNotification();
  const lostTipVisible = useRef<boolean>(false);
  const { setPusherExecuting, setPushing } = useClassroomStore.getState();
  const pusher = useClassroomStore(state => state.pusher);
  const microphone = useClassroomStore(state => state.microphone);
  const camera = useClassroomStore(state => state.camera);
  const { status } = useClassroomStore(state => state.classroomInfo);
  const hasBoardStream = useClassroomStore(state => !!state.board.mediaStream);
  const joinedGroupId = useClassroomStore(state => state.joinedGroupId);

  useEffect(() => {
    if (!pusher.pushing) {
      return;
    }
    const closeLostTip = () => {
      lostTipVisible.current = false;
      notification.close('connectionlost');
    };

    const connectionlostHandler = () => {
      if (lostTipVisible.current) {
        return;
      }
      lostTipVisible.current = true;
      // 推流异常，尝试重连中
      notice.warning({
        key: 'connectionlost',
        message: '推流异常，正在尝试重连中...',
        duration: 0,
      });

      logger.reportInfo(EMsgid.CONNECTION_LOST);
    };

    const networkrecoveryHandler = () => {
      closeLostTip();
      notice.success({
        message: '推流重连成功',
      });

      logger.reportInfo(EMsgid.NETWORK_RECOVERY);
    };

    const reconnectexhaustedHandler = () => {
      closeLostTip();
      notice.error({
        key: 'reconnectexhausted',
        message: '推流中断，请在网络恢复后重新开课',
        duration: 0,
      });
      setPushing(false);

      logger.reportInfo(EMsgid.RECONNECT_EXHAUSTED);
    };

    livePusher.network.on('connectionlost', connectionlostHandler);
    livePusher.network.on('networkrecovery', networkrecoveryHandler);
    livePusher.network.on('reconnectexhausted', reconnectexhaustedHandler);

    return () => {
      livePusher.network.off('connectionlost', connectionlostHandler);
      livePusher.network.off('networkrecovery', networkrecoveryHandler);
      livePusher.network.on('reconnectexhausted', reconnectexhaustedHandler);
    };
  }, [pusher.pushing]);

  useEffect(() => {
    if (!pusher.interrupted) {
      notification.close('shutdown');
    }
  }, [pusher.interrupted]);

  // 需要有白板画面流，且不是已结束状态时才允许推流，并且还需要已加入消息群组
  const canPush = useMemo(() => {
    return (
      joinedGroupId &&
      hasBoardStream &&
      (status === ClassroomStatusEnum.not_start ||
        status === ClassroomStatusEnum.started)
    );
  }, [status, microphone, camera, hasBoardStream, joinedGroupId]);

  const handleClick = () => {
    if (pusher.pushing) {
      modal.confirm({
        title: '结束课程',
        content: '确认结束课程？',
        okButtonProps: {
          danger: true,
        },
        okText: '结束',
        cancelText: '取消',
        onOk: () => {
          setPusherExecuting(true);
        },
      });
    } else {
      setPusherExecuting(true);
    }
  };

  return (
    <Fragment>
      {contextHolder}
      {noticeHolder}
      <Popover content={noPermissionNotify}>
        <Button
          type="primary"
          className={styles['push-button']}
          danger={pusher.pushing}
          disabled={noPermission || (!pusher.pushing && !canPush)}
          loading={pusher.executing}
          onClick={handleClick}
        >
          {pusher.pushing ? '结束课程' : '上课'}
        </Button>
      </Popover>
    </Fragment>
  );
}
