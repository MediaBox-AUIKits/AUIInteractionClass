import React, { useMemo, useState } from 'react';
import { Popover } from 'antd';
import Announcement from './Announcement';
import CheckInManagement from './CheckInManagement';
import { ToolsSvg } from '@/components/ClassRoom/components/icons';
import styles from './index.less';
import commonStyles from '../index.less';

interface IProps {
  canUpdateAnnouncement?: boolean; // 公告管理
  canManageCheckIn?: boolean; // 签到管理
}

const Tools: React.FC<IProps> = props => {
  const { canUpdateAnnouncement = false, canManageCheckIn = false } = props;
  const [tipOpen, setTipOpen] = useState(false);

  const showAnnouncementManagement = useMemo(
    () => canUpdateAnnouncement,
    [canUpdateAnnouncement]
  );

  const showCheckInManagement = useMemo(
    () => canUpdateAnnouncement,
    [canManageCheckIn]
  );

  const renderAnnoucementManagement = useMemo(
    () =>
      showAnnouncementManagement ? (
        <Announcement onClick={() => setTipOpen(false)} />
      ) : null,
    [showAnnouncementManagement]
  );

  const renderCheckInManagement = useMemo(
    () =>
      showCheckInManagement ? (
        <CheckInManagement onClick={() => setTipOpen(false)} />
      ) : null,
    [showCheckInManagement]
  );

  const toolsPanel = useMemo(
    () => (
      <>
        <div className={styles['tools-panel']}>
          {renderAnnoucementManagement}
        </div>
        <div className={styles['tools-panel']}>{renderCheckInManagement}</div>
      </>
    ),
    [renderAnnoucementManagement, renderCheckInManagement]
  );

  if (!showAnnouncementManagement && !showCheckInManagement) return null;

  return (
    <Popover content={toolsPanel} open={tipOpen} onOpenChange={setTipOpen}>
      <div className={commonStyles['button-wrapper']}>
        <div className={commonStyles.button}>
          <ToolsSvg />
          <div className={commonStyles['button-text']}>教学工具</div>
        </div>
      </div>
    </Popover>
  );
};

export default Tools;
