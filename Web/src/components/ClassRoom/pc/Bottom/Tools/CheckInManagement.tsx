import React, { Fragment, useState } from 'react';
import CheckInManagementModal from '@/components/ClassRoom/components/CheckInManagement';
import { CalendarOutlinedSvg } from '@/components/ClassRoom/components/icons';
import styles from './index.less';

interface IProps {
  onClick?: () => void;
}

const CheckInManagement: React.FC<IProps> = props => {
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const { onClick } = props;

  const openCheckInManagementModal = () => {
    setModalOpened(true);
    onClick?.();
  };

  return (
    <Fragment>
      <CheckInManagementModal
        visible={modalOpened}
        onClose={() => setModalOpened(false)}
      />
      <div className={styles.button} onClick={openCheckInManagementModal}>
        <CalendarOutlinedSvg className={styles.button__icon} />
        签到
      </div>
    </Fragment>
  );
};

export default CheckInManagement;
