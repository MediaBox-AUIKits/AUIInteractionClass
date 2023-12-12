/**
 * 该文件为 PC 学生端举手组件
 */
import React from 'react';
import { Tooltip } from 'antd';
import { HandSvg } from '../../components/icons';
import StudentInteraction from '../../components/StudentInteraction';
import { PermissionVerificationProps } from '../../types';
import classNames from 'classnames';
import styles from './index.less';

interface IProps {
  before?: React.ReactNode;
}

const ApplicationPC: React.FC<PermissionVerificationProps<IProps>> = props => {
  const { noPermission = false, noPermissionNotify, before = null } = props;

  const initial = (
    <div className={styles.button}>
      <HandSvg />
      <div className={styles['button-text']}>申请连麦</div>
    </div>
  );

  const disabled = (
    <div className={classNames(styles.button, styles.disabled)}>
      <HandSvg />
      <div className={styles['button-text']}>申请连麦</div>
    </div>
  );

  const loading = (
    <Tooltip title="点击取消连麦">
      <div className={classNames(styles.button, styles.active)}>
        <HandSvg />
        <div className={styles['button-text']}>连麦中...</div>
      </div>
    </Tooltip>
  );

  const accepted = (
    <div className={classNames(styles.button, styles.active)}>
      <HandSvg />
      <div className={styles['button-text']}>结束连麦</div>
    </div>
  );

  return (
    <>
      {before}
      <div className={styles['button-wrapper']}>
        {noPermission ? (
          <Tooltip title={noPermissionNotify}>{disabled}</Tooltip>
        ) : (
          <StudentInteraction
            compWrapperClassName={styles.buttonContainer}
            initialComp={initial}
            disabledComp={disabled}
            loadingComp={loading}
            activeComp={accepted}
          />
        )}
      </div>
    </>
  );
};

export default ApplicationPC;
