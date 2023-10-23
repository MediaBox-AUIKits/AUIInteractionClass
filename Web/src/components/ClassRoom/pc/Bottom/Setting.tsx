import React, { useCallback, useContext } from 'react';
import { Popover, Checkbox } from 'antd';
import toast from '@/utils/toast';
import { SettingSvg } from '@/components/ClassRoom/components/icons';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '../../ClassContext';
import logger from '../../utils/Logger';
import { ClassroomModeEnum } from '../../types';
import styles from './index.less';

const ScreenShare: React.FC = () => {
  const {
    classroomInfo: { mode },
    joinedGroupId,
    interactionAllowed,
    allMicMuted,
    groupMuted,
    connectedSpectators,
    interactionInvitationUsers,
    setAllMicMuted,
    setInteractionAllowed,
  } = useClassroomStore(state => state);
  const { auiMessage } = useContext(ClassContext);

  const toggleMuteGroup = useCallback(
    (e: any) => {
      if (!e.target.checked) {
        // 取消禁言
        auiMessage
          .cancelMuteGroup()
          .then(() => {
            // 在整个入口文件中监听 取消全员禁言 事件
          })
          .catch((err: any) => {
            if (err instanceof AggregateError) {
              const msg = err.errors
                .map((error: any) => error.message || error)
                .join(';');
              logger.cancelMuteGroupError(msg);
            } else {
              logger.cancelMuteGroupError(err);
            }
            console.log('cancelMuteAll 失败', err);
            toast.error('全员禁言关闭失败');
          });
        return;
      }
      // 全员禁言
      auiMessage
        .muteGroup()
        .then(() => {
          // 在整个入口文件中监听 全员禁言 事件
        })
        .catch((err: any) => {
          if (err instanceof AggregateError) {
            const msg = err.errors
              .map((error: any) => error.message || error)
              .join(';');
            logger.muteGroupError(msg);
          } else {
            logger.muteGroupError(err);
          }
          console.log('muteAll 失败', err);
          toast.error('全员禁言开启失败');
        });
    },
    [joinedGroupId]
  );

  const onSwitchInteractionAllowed = useCallback(() => {
    setInteractionAllowed(!interactionAllowed);
  }, [interactionAllowed]);
  const onSwitchAllMicMuted = useCallback(() => {
    setAllMicMuted(!allMicMuted);
  }, [allMicMuted]);

  const settingPanel = (
    <div className={styles['setting-panel']}>
      <div className={styles['setting-panel__group']}>
        <div className={styles['setting-panel__group__title']}>成员讨论</div>
        <div className={styles['setting-panel__group__content']}>
          <div className={styles['setting-panel__group__content_item']}>
            <div className={styles['setting-panel__group__content_item_label']}>
              全员禁言
            </div>
            <div
              className={styles['setting-panel__group__content_item_checkbox']}
            >
              <Checkbox
                disabled={!joinedGroupId}
                checked={groupMuted}
                onChange={toggleMuteGroup}
              />
            </div>
          </div>
        </div>
      </div>
      {mode === ClassroomModeEnum.Open ? null : (
        <div className={styles['setting-panel__group']}>
          <div className={styles['setting-panel__group__title']}>连麦成员</div>
          <div className={styles['setting-panel__group__content']}>
            <div className={styles['setting-panel__group__content_item']}>
              <div
                className={styles['setting-panel__group__content_item_label']}
              >
                允许学员连麦
              </div>
              <div
                className={
                  styles['setting-panel__group__content_item_checkbox']
                }
              >
                <Checkbox
                  disabled={!!interactionInvitationUsers.length}
                  checked={interactionAllowed}
                  onChange={onSwitchInteractionAllowed}
                />
              </div>
            </div>
            <div className={styles['setting-panel__group__content_item']}>
              <div
                className={styles['setting-panel__group__content_item_label']}
              >
                全员静音
              </div>
              <div
                className={
                  styles['setting-panel__group__content_item_checkbox']
                }
              >
                <Checkbox
                  checked={allMicMuted}
                  disabled={connectedSpectators.length < 2}
                  onChange={onSwitchAllMicMuted}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  return (
    <Popover content={settingPanel}>
      <div className={styles['button-wrapper']}>
        <div className={styles.button}>
          <SettingSvg />
          <div className={styles['button-text']}>设置</div>
        </div>
      </div>
    </Popover>
  );
};

export default ScreenShare;
