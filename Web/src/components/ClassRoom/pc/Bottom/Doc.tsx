import React, { useState, useMemo, useCallback } from 'react';
import { Popover } from 'antd';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import { PermissionVerificationProps } from '../../types';
import whiteBoardFactory from '../../utils/whiteboard';
import { FolderSvg, FolderDisableSvg } from '../../components/icons';
import styles from './index.less';

interface IProps {
  disabled?: boolean;
}

const Doc: React.FC<PermissionVerificationProps<IProps>> = props => {
  const {
    noPermission = false,
    noPermissionNotify,
    disabled: propDisabled = false,
  } = props;
  const wbIns = useMemo(() => {
    return whiteBoardFactory.getInstance('netease');
  }, []);
  const { enable: displayEnable } = useClassroomStore(state => state.display);
  const localPreviewing = useClassroomStore(
    state => state.localMedia.sources.length !== 0
  );
  const [tipOpen, setTipOpen] = useState(false);

  const disabled = useMemo(
    () => displayEnable || localPreviewing || noPermission || propDisabled,
    [displayEnable, localPreviewing, noPermission, propDisabled]
  );

  const disabledText = useMemo(() => {
    if (noPermission) return noPermissionNotify;
    if (displayEnable) return '结束屏幕共享后可使用';
    if (localPreviewing) return '关闭音视频画面后可恢复使用';
  }, [displayEnable, localPreviewing, noPermission, noPermissionNotify]);

  const openDocManager = useCallback(() => {
    if (!disabled) {
      wbIns?.openUploadModal();
    }
  }, [disabled]);

  return (
    <Popover
      content={disabledText}
      open={tipOpen}
      onOpenChange={bool => {
        setTipOpen(disabledText ? bool : false);
      }}
    >
      <div className={styles['button-wrapper']}>
        <div
          className={classNames(styles.button, {
            [styles.disabled]: !!disabled,
          })}
          onClick={openDocManager}
        >
          {disabled ? <FolderDisableSvg /> : <FolderSvg />}
          <div className={styles['button-text']}>课件</div>
        </div>
      </div>
    </Popover>
  );
};

export default Doc;
