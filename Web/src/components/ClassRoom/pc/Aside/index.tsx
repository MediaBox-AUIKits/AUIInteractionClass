import React from 'react';
import classNames from 'classnames';
import SelfPlayer from '../SelfPlayer';
import ChatBox from '../ChatPanel';
import styles from './index.less';

interface IRoomAsideProps {
  className?: string;
}

const RoomAside: React.FC<IRoomAsideProps> = props => {
  const { className } = props;

  return (
    <aside className={classNames(styles.aside, className)}>
      <SelfPlayer className={styles['aside__player']} />
      <div className={styles['aside__tab']}>
        <span className={classNames(styles['aside__tab__item'], 'active')}>
          成员讨论
        </span>
      </div>
      <ChatBox className={styles['aside__chatbox']} />
    </aside>
  );
};

export default RoomAside;
