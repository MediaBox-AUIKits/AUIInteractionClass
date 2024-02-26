import React, { useMemo, useState } from 'react';
import { Popover } from 'antd';
import Announcement from './Announcement';
import { ToolsSvg } from '@/components/ClassRoom/components/icons';
import styles from './index.less';
import commonStyles from '../index.less';

interface IProps {
  canUpdateAnnouncement?: boolean; // 公告管理
  canManageAttendance?: boolean; // 签到管理 TODO: 下版本实现
}

const Tools: React.FC<IProps> = props => {
  const { canUpdateAnnouncement = false } = props;
  const [tipOpen, setTipOpen] = useState(false);

  const showAnnouncementManagement = useMemo(
    () => canUpdateAnnouncement,
    [canUpdateAnnouncement]
  );

  const renderAnnoucementManagement = useMemo(
    () =>
      showAnnouncementManagement ? (
        <Announcement onClick={() => setTipOpen(false)} />
      ) : null,
    [showAnnouncementManagement]
  );

  const toolsPanel = useMemo(
    () => (
      <div className={styles['tools-panel']}>{renderAnnoucementManagement}</div>
    ),
    [renderAnnoucementManagement]
  );

  if (!showAnnouncementManagement) return null;

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
