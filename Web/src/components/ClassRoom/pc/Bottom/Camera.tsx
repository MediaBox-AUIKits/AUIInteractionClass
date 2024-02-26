import { useEffect, useState, useMemo } from 'react';
import { Dropdown, Popover } from 'antd';
import classNames from 'classnames';
import livePush from '../../utils/LivePush';
import useClassroomStore from '../../store';
import {
  LeftOutlinedSvg,
  CameraCloseSvg,
  CameraDisableSvg,
  CameraLoadingSvg,
  CameraNormalSvg,
} from '../../components/icons';
import toast from '@/utils/toast';
import { PermissionVerificationProps } from '../../types';
import styles from './index.less';

interface IProps {
  disabled: boolean;
  disabledTooltip?: string;
}

export default function Camera(props: PermissionVerificationProps<IProps>) {
  const {
    disabled: _disabled,
    disabledTooltip,
    noPermission,
    noPermissionNotify,
  } = props;
  const disabled = useMemo(
    () => noPermission || _disabled,
    [_disabled, noPermission]
  );
  const disabledText = useMemo(() => {
    if (noPermission) return noPermissionNotify;
    if (disabled) return disabledTooltip;
  }, [_disabled, disabledTooltip, noPermission, noPermissionNotify]);

  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const [showList, setShowList] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);

  const { setCameraDeviceCount, setCameraDevice, setCameraEnable } =
    useClassroomStore.getState();
  const cameraState = useClassroomStore(state => state.camera);

  useEffect(() => {
    const updateCameraList = () => {
      if (disabled) {
        setCameraDeviceCount(0);
        return;
      }

      livePusher
        .getCameras()
        .then((cameraList: any[]) => {
          setCameraDeviceCount(cameraList.length);
          if (cameraList.length === 0) {
            toast.error('未发现摄像头，请检查设备状况');
            return;
          }
          setDeviceList(cameraList);

          const currentDeviceId = useClassroomStore.getState().camera.deviceId;
          // 当前选中不存在与列表（为初始化或被移除），默认选中第一个
          if (!cameraList.find(camera => camera.deviceId === currentDeviceId)) {
            setCameraDevice(cameraList[0].deviceId);
          }

          // 未初始化
          if (!currentDeviceId) {
            setCameraEnable(true, true);
          }
        })
        .catch(() => {
          // 没有权限
        });
    };

    updateCameraList();
    navigator?.mediaDevices?.addEventListener('devicechange', updateCameraList);
    return () => {
      navigator?.mediaDevices?.removeEventListener(
        'devicechange',
        updateCameraList
      );
    };
  }, [disabled]);

  useEffect(() => {
    setSwitching(false);
  }, [cameraState.trackId]);

  // 如果摄像头被关闭，switching 状态也需要重置
  useEffect(() => {
    if (!cameraState.enable) {
      setSwitching(false);
    }
  }, [cameraState.enable]);

  const toggleCamera = () => {
    setSwitching(true);
    setCameraEnable(!cameraState.enable);
  };

  const changeDevice = (deviceId: string) => {
    setShowList(false);
    setCameraDevice(deviceId);
  };

  const renderIcon = () => {
    if (switching || disabled || deviceList.length === 0) {
      return (
        <Popover content={disabledText}>
          <div className={classNames(styles.button, styles.disabled)}>
            {switching ? <CameraLoadingSvg /> : <CameraDisableSvg />}
            <div className={styles['button-text']}>摄像头</div>
          </div>
        </Popover>
      );
    }
    return (
      <div className={styles.button} onClick={toggleCamera}>
        {cameraState.enable ? <CameraNormalSvg /> : <CameraCloseSvg />}
        <div className={styles['button-text']}>
          {cameraState.enable ? '' : '打开'}摄像头
        </div>
      </div>
    );
  };

  return (
    <div className={styles['button-wrapper']}>
      {renderIcon()}
      {!disabled && deviceList.length > 1 && (
        <Dropdown
          overlayStyle={{ width: '220px' }}
          menu={{
            selectable: true,
            selectedKeys: cameraState.deviceId ? [cameraState.deviceId] : [],
            onSelect: e => changeDevice(e.key),
            items: [
              {
                key: 'grp',
                label: '选择摄像头',
                type: 'group',
                children: deviceList.map(item => ({
                  key: item.deviceId,
                  label: item.label,
                })),
              },
            ],
          }}
          trigger={['click']}
          placement="top"
          onOpenChange={o => setShowList(o)}
        >
          <div
            className={classNames(styles['arrow-button'], {
              [styles.highlight]: showList,
            })}
            onClick={() => setShowList(s => !s)}
          >
            <LeftOutlinedSvg />
          </div>
        </Dropdown>
      )}
    </div>
  );
}
