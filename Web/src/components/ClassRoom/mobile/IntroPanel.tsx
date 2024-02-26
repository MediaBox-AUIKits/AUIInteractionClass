import React, { useMemo } from 'react';
import useClassroomStore from '../store';
import { formatDate } from '../utils/common';
import styles from './IntroPanel.less';

interface IIntroPanelProps {
  className: string;
  hidden?: boolean;
}

const IntroPanel: React.FC<IIntroPanelProps> = props => {
  const { className, hidden = false } = props;
  const { id, notice, createdAt } = useClassroomStore(
    state => state.classroomInfo
  );

  const dateStr = useMemo(() => {
    if (createdAt) {
      return formatDate(new Date(createdAt));
    }
    return '';
  }, [createdAt]);

  return (
    <div
      className={className}
      style={{
        display: hidden ? 'none' : 'block',
      }}
    >
      {/* <h5 className={styles['intro-panel__title']}>{title}</h5> */}
      {dateStr ? (
        <p className={styles['intro-panel__date']}>{dateStr}</p>
      ) : null}
      <p className={styles['intro-panel__notice']}>教室号: {id}</p>
      <p className={styles['intro-panel__notice']}>{notice || ''}</p>
    </div>
  );
};

export default IntroPanel;
