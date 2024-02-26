import React, { useState, useMemo } from 'react';
import { Popover } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { HandSvg } from '../../../components/icons';
import ApplyingList from './ApplyingList';
import { ClassroomModeEnum, PermissionVerificationProps } from '../../../types';
import useClassroomStore from '../../../store';
import classNames from 'classnames';
import styles from '../index.less';
import popStyles from './index.less';

const InteractionApplication: React.FC<PermissionVerificationProps> = props => {
  const { noPermission = false, noPermissionNotify } = props;
  const {
    classroomInfo: { mode },
    applyingList,
  } = useClassroomStore(state => state);

  const disabled = useMemo(() => noPermission, [noPermission]);
  const disabledText = useMemo(() => {
    if (noPermission) return noPermissionNotify;
  }, [noPermission, noPermissionNotify]);

  const [tipOpen, setTipOpen] = useState(false);
  const popTitle = useMemo(
    () =>
      disabled || !applyingList.length ? (
        ''
      ) : (
        <div className={popStyles.popover__title}>
          连麦申请
          <CloseOutlined onClick={() => setTipOpen(false)} />
        </div>
      ),
    [disabled, applyingList]
  );

  const popContent = useMemo(() => {
    if (disabled) return disabledText;
    if (applyingList.length) return <ApplyingList />;
    return '暂无连麦申请';
  }, [disabled, disabledText, applyingList]);

  // 公开课没有连麦
  if (mode === ClassroomModeEnum.Open) return null;

  return (
    <Popover
      title={popTitle}
      content={popContent}
      trigger={'click'}
      open={tipOpen}
      onOpenChange={setTipOpen}
    >
      <div className={styles['button-wrapper']}>
        <div
          className={classNames(styles.button, {
            [styles.disabled]: !!disabled,
          })}
        >
          <HandSvg />
          <div className={styles['button-text']}>连麦申请</div>
        </div>
        {applyingList.length > 0 ? (
          <div className={styles.button_tag}>{applyingList.length}</div>
        ) : null}
      </div>
    </Popover>
  );
};

export default InteractionApplication;
