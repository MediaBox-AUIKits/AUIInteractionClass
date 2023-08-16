import { useRef, useEffect, useMemo, Fragment } from 'react';
import { Button, message, Modal, notification } from 'antd';
import useClassroomStore from '../../../store';
import livePush from '../../../utils/LivePush';
import logger from '../../../utils/Logger';
import { ClassroomStatusEnum } from '../../../types';
import styles from './index.less';

interface IProps {
  isMicrophoneDisabled: boolean;
  isCameraDisabled: boolean;
}

export default function PushButton({
  isMicrophoneDisabled,
  isCameraDisabled,
}: IProps) {
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
      logger.connectionLost();
      // 推流异常，尝试重连中
      notice.warning({
        key: 'connectionlost',
        message: '推流异常，正在尝试重连中...',
        duration: 0,
      });
    };

    const networkrecoveryHandler = () => {
      logger.networkRecovery();
      closeLostTip();
      notice.success({
        message: '推流重连成功',
      });
    };

    const reconnectexhaustedHandler = () => {
      logger.reconnectExhausted();
      closeLostTip();
      notice.error({
        key: 'reconnectexhausted',
        message: '推流中断，请在网络恢复后重新开课',
        duration: 0,
      });
      setPushing(false);
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

  // 目前允许无麦克风、摄像头也能推流，所以暂时无用
  const checkDevices = () => {
    let msg = '';
    if (isMicrophoneDisabled && isCameraDisabled) {
      msg = '应用程序未被授权摄像头/麦克风的访问权限，请在系统设置中授权访问';
    } else if (isMicrophoneDisabled) {
      msg = '应用程序未被授权麦克风的访问权限，请在系统设置中授权访问';
    } else if (isCameraDisabled) {
      msg = '应用程序未被授权摄像头的访问权限，请在系统设置中授权访问';
    } else {
      const classroomState = useClassroomStore.getState();
      const noMicrophone = classroomState.microphone.deviceCount === 0;
      const noCamera = classroomState.camera.deviceCount === 0;
      if (noMicrophone && noCamera) {
        msg = '未发现摄像头/麦克风，请检查设备状况';
      } else if (noMicrophone) {
        msg = '未发现麦克风，请检查设备状况';
      } else if (noCamera) {
        msg = '未发现摄像头，请检查设备状况';
      }
    }
    if (msg) {
      message.warning(msg);
    }
  };

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
      // checkDevices();
      setPusherExecuting(true);
    }
  };

  return (
    <Fragment>
      {contextHolder}
      {noticeHolder}

      <Button
        type="primary"
        className={styles['push-button']}
        danger={pusher.pushing}
        disabled={!pusher.pushing && !canPush}
        loading={pusher.executing}
        onClick={handleClick}
      >
        {pusher.pushing ? '结束课程' : '上课'}
      </Button>
    </Fragment>
  );
}
