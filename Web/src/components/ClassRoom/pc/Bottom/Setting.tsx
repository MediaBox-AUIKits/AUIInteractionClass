import React, { useState, useCallback, useContext, useMemo } from 'react';
import { Popover, Checkbox } from 'antd';
import toast from '@/utils/toast';
import { SettingSvg } from '@/components/ClassRoom/components/icons';
import useClassroomStore from '@/components/ClassRoom/store';
import { ClassContext } from '../../ClassContext';
import logger, { EMsgid } from '../../utils/Logger';
import { ClassroomModeEnum } from '../../types';
import {
  AssistantCooperationManager,
  MuteGroupOrUserEvent,
} from '../../utils/AdminCooperation';
import styles from './index.less';

interface IProps {
  canMuteGroup?: boolean; // 全员禁言
  canMuteInteraction?: boolean; // 连麦全员静音
  canAllowInteraction?: boolean; // 允许连麦
}

const Setting: React.FC<IProps> = props => {
  const {
    canMuteGroup = false,
    canMuteInteraction = false,
    canAllowInteraction = false,
  } = props;
  const {
    classroomInfo: { mode },
    isTeacher,
    joinedGroupId,
    interactionAllowed,
    allMicMuted,
    groupMuted,
    connectedSpectators,
    interactionInvitationUsers,
    setAllMicMuted,
    setInteractionAllowed,
  } = useClassroomStore(state => state);
  const { auiMessage, cooperationManager } = useContext(ClassContext);

  const [groupMuting, setGroupMuting] = useState(false);

  const doMuteGroup = useCallback(
    async (mute = true) => {
      try {
        if (mute) {
          await auiMessage.muteGroup();
        } else {
          await auiMessage.cancelMuteGroup();
        }
      } catch (error) {
        console.warn(`${mute ? '' : '解除'}群组禁言失败`);
        throw error;
      }
    },
    [auiMessage]
  );

  const muteGroupProxy = useCallback(
    (mute = true) =>
      new Promise<void>((resolve, reject) => {
        const stateMachine = (
          cooperationManager as AssistantCooperationManager
        )?.muteGroup({
          mute,
        });
        stateMachine.on(MuteGroupOrUserEvent.Responsed, (payload: any) => {
          if (payload.success === false) reject();
          resolve();
        });
        stateMachine.on(MuteGroupOrUserEvent.Timeout, () => {
          reject();
        });
      }),
    [cooperationManager]
  );

  const toggleMuteGroup = useCallback(
    async (e: any) => {
      if (groupMuting) return;

      const mute = e.target.checked;
      logger.reportInvoke(EMsgid.MUTE_GROUP, { mute });
      setGroupMuting(true);

      try {
        if (
          isTeacher ||
          !CONFIG?.imServer?.aliyunIMV1?.enable ||
          !CONFIG?.imServer?.aliyunIMV1?.primary
        ) {
          await doMuteGroup(mute);
        } else {
          /**
           * NOTE: 由于旧阿里云IM无法支持非创建者群组禁言，因此使用IM请求创建者处理；
           * aliyunIMV1(Deprecation) 不建议开启并设置为 primary
           */
          await muteGroupProxy(mute);
        }
        logger.reportInvokeResult(EMsgid.MUTE_GROUP_RESULT, true, {
          mute,
        });
      } catch (err) {
        toast.error(`全员禁言${mute ? '开启' : '关闭'}失败`);
        console.log('cancelMuteAll 失败', err);
        logger.reportInvokeResult(
          EMsgid.MUTE_GROUP_RESULT,
          false,
          { mute },
          err
        );
      } finally {
        setGroupMuting(false);
      }
    },
    [isTeacher, doMuteGroup, muteGroupProxy]
  );

  const onSwitchInteractionAllowed = useCallback(() => {
    setInteractionAllowed(!interactionAllowed);
  }, [interactionAllowed]);

  const onSwitchAllMicMuted = useCallback(() => {
    setAllMicMuted(!allMicMuted);
  }, [allMicMuted]);

  const renderMuteGroup = useMemo(
    () =>
      canMuteGroup ? (
        <div className={styles['setting-panel__group__content_item']}>
          <div className={styles['setting-panel__group__content_item_label']}>
            全员禁言
          </div>
          <div
            className={styles['setting-panel__group__content_item_checkbox']}
          >
            <Checkbox
              disabled={!joinedGroupId || groupMuting}
              checked={groupMuted}
              onChange={toggleMuteGroup}
            />
          </div>
        </div>
      ) : null,
    [canMuteGroup, joinedGroupId, groupMuted, groupMuting, toggleMuteGroup]
  );

  const showMemberManagement = useMemo(() => canMuteGroup, [canMuteGroup]);

  const renderMemberManagement = useMemo(
    () =>
      showMemberManagement ? (
        <div className={styles['setting-panel__group']}>
          <div className={styles['setting-panel__group__title']}>成员讨论</div>
          <div className={styles['setting-panel__group__content']}>
            {renderMuteGroup}
          </div>
        </div>
      ) : null,
    [showMemberManagement, renderMuteGroup]
  );

  const renderAllowInteraction = useMemo(
    () =>
      canAllowInteraction ? (
        <div className={styles['setting-panel__group__content_item']}>
          <div className={styles['setting-panel__group__content_item_label']}>
            允许学员连麦
          </div>
          <div
            className={styles['setting-panel__group__content_item_checkbox']}
          >
            <Checkbox
              disabled={!!interactionInvitationUsers.length}
              checked={interactionAllowed}
              onChange={onSwitchInteractionAllowed}
            />
          </div>
        </div>
      ) : null,
    [
      canAllowInteraction,
      interactionInvitationUsers.length,
      interactionAllowed,
      onSwitchInteractionAllowed,
    ]
  );

  const renderMuteInteraction = useMemo(
    () =>
      canMuteInteraction ? (
        <div className={styles['setting-panel__group__content_item']}>
          <div className={styles['setting-panel__group__content_item_label']}>
            全员静音
          </div>
          <div
            className={styles['setting-panel__group__content_item_checkbox']}
          >
            <Checkbox
              checked={allMicMuted}
              disabled={connectedSpectators.length < 2}
              onChange={onSwitchAllMicMuted}
            />
          </div>
        </div>
      ) : null,
    [
      canMuteInteraction,
      allMicMuted,
      connectedSpectators.length,
      onSwitchAllMicMuted,
    ]
  );

  const showInteractionManagement = useMemo(
    () => canAllowInteraction || canMuteInteraction,
    [canAllowInteraction, canMuteInteraction]
  );

  const renderInteractionManagement = useMemo(
    () =>
      mode === ClassroomModeEnum.Open || !showInteractionManagement ? null : (
        <div className={styles['setting-panel__group']}>
          <div className={styles['setting-panel__group__title']}>连麦成员</div>
          <div className={styles['setting-panel__group__content']}>
            {renderAllowInteraction}
            {renderMuteInteraction}
          </div>
        </div>
      ),
    [mode, renderAllowInteraction, renderMuteInteraction]
  );

  const settingPanel = useMemo(
    () => (
      <div className={styles['setting-panel']}>
        {renderMemberManagement}
        {renderInteractionManagement}
      </div>
    ),
    [renderMemberManagement, renderInteractionManagement]
  );

  if (!showMemberManagement && !showInteractionManagement) return null;

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

export default Setting;
