import React, { useState, useMemo, Fragment } from 'react';
import classNames from 'classnames';
import H5Player from './H5Player';
import H5Tabs, { ChatTabKey, IntroTabKey } from './H5Tabs';
import IntroPanel from './IntroPanel';
import ChatPanel from './ChatPanel';
import ChatControls from './ChatControls';
import Announcement from './Announcement';
import { ClassroomStatusEnum, SourceType } from '../types';
import useClassroomStore from '../store';
import { supportSafeArea } from '../utils/common';
import styles from './index.less';

interface PublicClassProps {
  onBarVisibleChange: (visible: boolean) => void;
  active: boolean;
}

const tabs = [ChatTabKey, IntroTabKey];

function PublicClass(props: PublicClassProps) {
  const { active, onBarVisibleChange } = props;
  const {
    classroomInfo: { status, linkInfo, teacherId },
    connectedSpectators,
  } = useClassroomStore(state => state);
  const [tabKey, setTabKey] = useState<string>(ChatTabKey);

  const hasSafeAreaBottom = useMemo(() => {
    return supportSafeArea('bottom');
  }, []);

  const isInited = useMemo(() => {
    return status !== ClassroomStatusEnum.no_data;
  }, [status]);

  const tabList = useMemo(() => tabs.map(key => ({ key })), [tabs]);

  const cdnUrlMap = useMemo(
    () => ({
      [SourceType.Camera]: linkInfo?.cdnPullInfo ?? {},
    }),
    [linkInfo]
  );

  const hasSource = useMemo(() => {
    const teacherPubStatus = connectedSpectators.find(
      item => item.userId === teacherId
    ) ?? {
      isAudioPublishing: false,
      isScreenPublishing: false,
      isVideoPublishing: false,
    };
    const { isAudioPublishing, isScreenPublishing, isVideoPublishing } =
      teacherPubStatus;
    return isAudioPublishing || isScreenPublishing || isVideoPublishing;
  }, [connectedSpectators, teacherId]);

  if (!active) return;
  return (
    <>
      <H5Player
        id="mixed"
        sourceType={SourceType.Camera}
        cdnUrlMap={cdnUrlMap}
        noSource={!hasSource}
        onBarVisibleChange={onBarVisibleChange}
      />
      <div
        className={classNames(styles.h5main, {
          [styles['not-safe-area']]: !hasSafeAreaBottom,
        })}
      >
        {isInited ? (
          <Fragment>
            <H5Tabs
              value={tabKey}
              tabs={tabList}
              onChange={tab => setTabKey(tab)}
            />

            {tabKey === IntroTabKey ? (
              <IntroPanel className={styles.h5content__intro} />
            ) : null}

            {tabKey === ChatTabKey ? (
              <ChatPanel className={styles.h5content__chat} />
            ) : null}

            <Announcement className={styles.h5announcement} />

            {tabKey === ChatTabKey ? (
              <ChatControls
                className={styles.h5controls}
                theme="light"
                heartIconActive
                allowChat={[
                  ClassroomStatusEnum.not_start,
                  ClassroomStatusEnum.started,
                ].includes(status)}
              />
            ) : null}
          </Fragment>
        ) : null}
      </div>
    </>
  );
}

export default PublicClass;
