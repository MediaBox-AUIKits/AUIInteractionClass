import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';
import { Dialog } from 'antd-mobile';
import { UA } from '@/utils/common';
import styles from './index.less';

interface NoDevicePermissionsProps {
  show: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
}

function NoDevicePermissions(props: NoDevicePermissionsProps) {
  const { show, onConfirm, onClose } = props;

  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    onClose?.();
  }, [onConfirm, onClose]);

  const dialogTitle = '暂无权限';
  const dialogContent = (
    <div className={styles['no-device-permissions']}>
      <p className={styles['no-device-permissions__help']}>
        <InfoCircleFilled
          className={styles['no-device-permissions__help__icon']}
        />
        暂不支持本次通话，开启权限后可重新进行连麦通话操作
      </p>
      应用程序无法访问你的摄像头/麦克风权限，请在系统设置中开启相关权限
    </div>
  );

  if (UA.isPC) {
    return (
      <Modal
        open={visible}
        title={dialogTitle}
        footer={
          <Button key="ok" onClick={handleConfirm}>
            知道了
          </Button>
        }
        onCancel={onClose}
      >
        {dialogContent}
      </Modal>
    );
  }
  // TODO: 移动端连麦待开发
  return (
    <Dialog
      visible={visible}
      content={dialogContent}
      actions={[
        {
          key: 'confirm',
          text: '前往设置',
          onClick: () => handleConfirm(),
        },
      ]}
    />
  );
}

export default NoDevicePermissions;
