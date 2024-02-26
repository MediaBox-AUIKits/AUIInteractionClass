import React, { useState, useCallback, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { LeftOutlinedSvg } from '../../components/icons';
import { MoreOutlined } from '@ant-design/icons';
import AnnouncementModal from '@/components/ClassRoom/components/Announcement';
import { Dropdown } from 'antd';
import styles from './AsideAnnouncement.less';
import useClassroomStore from '../../store';
import { ClassroomFunction } from '../../types';

interface IAsideAnnouncementProps {
  className?: string;
}

const AsideAnnouncement: React.FC<IAsideAnnouncementProps> = props => {
  const { className } = props;
  const { groupMeta, accessibleFunctions } = useClassroomStore.getState();
  const wrappedContentRef = useRef<HTMLDivElement | null>(null);
  const [expand, setExpand] = useState(false);
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [overflow, setOverflow] = useState(false);
  const canUpdateAnnouncement = accessibleFunctions.includes(
    ClassroomFunction.EditAnnouncement
  );

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

  const handleEditAnnouncement =
    (enable = true) =>
    () => {
      setModalOpened(enable);
    };

  const MoreAction = () =>
    canUpdateAnnouncement ? (
      <Dropdown
        menu={{
          items: [
            {
              label: '编辑公告',
              key: 'edit',
            },
          ],
          onClick: handleEditAnnouncement(true),
        }}
        arrow
        placement="bottomRight"
      >
        <div className={styles['aside__announcement__actions__more']}>
          <MoreOutlined className={styles['more-button']} />
        </div>
      </Dropdown>
    ) : null;

  if (!groupMeta.announcement?.content) return null;

  return (
    <div
      className={classNames(styles['aside__announcement__wrapper'], className, {
        [styles.overflow]: overflow && canUpdateAnnouncement,
      })}
    >
      <div className={styles['aside__announcement']}>
        <div
          ref={wrappedContentRef}
          className={classNames(styles['aside__announcement__content'], {
            [styles.expand]: expand,
          })}
        >
          <span className={styles['aside__announcement__content__label']}>
            【公告】
          </span>
          {groupMeta?.announcement?.content}
        </div>
        <div className={styles.aside__announcement__actions}>
          {overflow ? (
            <div
              className={classNames(
                styles['aside__announcement__actions__expand'],
                {
                  [styles.expand]: expand,
                }
              )}
              onClick={handleExpand}
            >
              <LeftOutlinedSvg />
            </div>
          ) : (
            <MoreAction />
          )}
          {overflow && <MoreAction />}
        </div>
      </div>
      <AnnouncementModal
        visible={modalOpened}
        initEditable
        onClose={handleEditAnnouncement(false)}
      />
    </div>
  );
};

export default AsideAnnouncement;
