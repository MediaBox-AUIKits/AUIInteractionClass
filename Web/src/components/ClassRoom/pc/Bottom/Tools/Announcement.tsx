import React, { Fragment, useState } from 'react';
import AnnouncementModal from '@/components/ClassRoom/components/Announcement';
import { AnnouncementSvg } from '@/components/ClassRoom/components/icons';
import styles from './index.less';

interface IProps {
  onClick?: () => void;
}

const Announcement: React.FC<IProps> = props => {
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const { onClick } = props;

  const openAnnouncementModal = () => {
    setModalOpened(true);
    onClick?.();
  };

  return (
    <Fragment>
      <AnnouncementModal
        visible={modalOpened}
        onClose={() => setModalOpened(false)}
      />
      <div className={styles.button} onClick={openAnnouncementModal}>
        <AnnouncementSvg className={styles.button__icon} />
        公告
      </div>
    </Fragment>
  );
};

export default Announcement;
