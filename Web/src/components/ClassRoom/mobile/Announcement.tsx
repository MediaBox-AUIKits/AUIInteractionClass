import React, { useState, useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { LeftOutlinedSvg } from '../components/icons';
import styles from './Announcement.less';
import useClassroomStore from '../store';

interface IProps {
  className: string;
}

const Announcement: React.FC<IProps> = props => {
  const { className } = props;
  const { groupMeta } = useClassroomStore.getState();
  const wrappedContentRef = useRef<HTMLDivElement | null>(null);
  const [expand, setExpand] = useState(false);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    setExpand(false);
    if (wrappedContentRef.current) {
      setTimeout(() => {
        const { scrollHeight, clientHeight } = wrappedContentRef.current!;
        setOverflow(scrollHeight > clientHeight);
      }, 0);
    }
    setOverflow(false);
  }, [groupMeta.announcement?.content]);

  const handleExpand = useCallback(() => {
    setExpand(!expand);
  }, [expand]);

  if (!groupMeta.announcement?.content) return null;

  return (
    <div className={classNames(styles.announcement__wrapper, className)}>
      <div className={classNames(styles['announcement'], className)}>
        <div
          ref={wrappedContentRef}
          className={classNames(styles['announcement__content'], {
            [styles['expand']]: expand,
          })}
          onClick={handleExpand}
        >
          <span className={styles['announcement__content__label']}>
            【公告】
          </span>
          {groupMeta?.announcement?.content}
        </div>
        {overflow ? (
          <div
            className={classNames(styles['announcement__expand'], {
              [styles['expand']]: expand,
            })}
          >
            <LeftOutlinedSvg />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Announcement;
