import React, { useState, useMemo, Fragment } from 'react';
import classNames from 'classnames';
import H5Player from './H5Player';
import H5Tabs, { ChatTabKey, IntroTabKey } from './H5Tabs';
import IntroPanel from './IntroPanel';
import ChatPanel from './ChatPanel';
import ChatControls from './ChatControls';
import { ClassroomStatusEnum } from '../types';
import useClassroomStore from '../store';
import { supportSafeArea } from '../utils/common';
import styles from './index.less';

const MobileClassRoom: React.FC = () => {
  const { status } = useClassroomStore(state => state.classroomInfo);
  const [tabs, setTabs] = useState<string[]>([ChatTabKey, IntroTabKey]);
  const [tabKey, setTabKey] = useState<string>(ChatTabKey);

  const hasSafeAreaBottom = useMemo(() => {
    return supportSafeArea('bottom');
  }, []);

  const isInited = useMemo(() => {
    return status !== ClassroomStatusEnum.no_data;
  }, [status]);

  return (
    <div className={styles.h5wrap}>
      <H5Player />

      <div
        className={classNames(styles.h5main, {
          [styles['not-safe-area']]: !hasSafeAreaBottom,
        })}
      >
        {isInited ? (
          <Fragment>
            <H5Tabs
              value={tabKey}
              tabs={tabs}
              onChange={tab => setTabKey(tab)}
            />

            <IntroPanel
              className={styles.h5content}
              hidden={tabKey !== IntroTabKey}
            />

            {tabs.includes(ChatTabKey) ? (
              <ChatPanel
                className={styles.h5content}
                hidden={tabKey !== ChatTabKey}
              />
            ) : null}

            <ChatControls
              className={styles.h5controls}
              theme="light"
              heartIconActive
              allowChat={
                tabKey === ChatTabKey &&
                [
                  ClassroomStatusEnum.not_start,
                  ClassroomStatusEnum.started,
                ].includes(status)
              }
            />
          </Fragment>
        ) : null}
      </div>
    </div>
  );
};

export default MobileClassRoom;
