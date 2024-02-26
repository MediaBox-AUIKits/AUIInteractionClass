import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import KickMember from '../KickMember';
import useClassroomStore from '@/components/ClassRoom/store';
import { CommentMessage } from '@/components/ClassRoom/types';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { AsideContext } from '../index';
import styles from './index.less';

interface IMessageItemControlProps {
  muted?: boolean;
  message: CommentMessage;
  onRecall: (messageId: string) => void;
  onBatchRecall?: (messageId: string) => void;
}

const MessageItemControl: React.FC<IMessageItemControlProps> = props => {
  const { muted, message, onRecall, onBatchRecall } = props;
  const {
    classroomInfo: { teacherId, assistantId },
  } = useClassroomStore(state => state);
  const { canKickMember, canMuteUser, canRemoveMessage } =
    useContext(AsideContext);
  const { auiMessage } = useContext(ClassContext);
  const canBeMuted = useMemo(
    () => message.userId !== teacherId && message.userId !== assistantId,
    [teacherId, assistantId, message]
  );
  const canBeKicked = useMemo(
    () => message.userId !== teacherId && message.userId !== assistantId,
    [teacherId, assistantId, message]
  );
  const [userBeMuted, setUserBeMuted] = useState(false);

  useEffect(() => {
    setUserBeMuted(!!muted);
  }, [muted]);

  const moreActions: any[] = useMemo(() => {
    const msgActions = [];
    const msgBatchActions = [];
    const memberActions = [];
    if (canRemoveMessage) {
      msgActions.push({
        label: '撤回消息',
        key: 'recall',
      });
      msgBatchActions.push({
        label: '批量撤回',
        key: 'batchRecall',
      });
    }
    if (canMuteUser && canBeMuted) {
      if (userBeMuted) {
        msgActions.push({
          label: '解除禁言',
          key: 'unMute',
        });
      } else {
        msgActions.push({
          label: '禁言',
          key: 'mute',
        });
      }
    }
    if (canKickMember && canBeKicked) {
      const { userId, nickName } = message;
      memberActions.push({
        label: (
          <KickMember userId={userId} userName={nickName ?? userId}>
            移除教室
          </KickMember>
        ),
        key: 'kick',
      });
    }

    const actions = [];
    actions.push(...msgActions);

    if (actions.length && msgBatchActions.length) {
      actions.push(
        {
          type: 'divider',
        },
        ...msgBatchActions
      );
    }
    if (actions.length && memberActions.length) {
      actions.push(
        {
          type: 'divider',
        },
        ...memberActions
      );
    }
    return actions;
  }, [
    message,
    canMuteUser,
    canKickMember,
    canRemoveMessage,
    canBeMuted,
    canBeKicked,
    userBeMuted,
  ]);

  const handleRecallMessage = useCallback(async () => {
    if (!message.messageId || !canRemoveMessage) return;
    onRecall?.(message.messageId);
  }, [auiMessage, message, canRemoveMessage, onRecall]);

  const handleMute = useCallback(
    async (mute = true) => {
      // 不能对老师或助教禁言
      if (!canBeMuted) return;

      try {
        if (mute) {
          await auiMessage.muteUser(message.userId);
        } else {
          await auiMessage.cancelMuteUser(message.userId);
        }
        setUserBeMuted(mute);
      } catch (error) {
        console.warn(`${message.userId}${mute ? '' : '解除'}禁言失败`);
        throw error;
      }
    },
    [auiMessage, message, canBeMuted]
  );

  const handleMoreClick: MenuProps['onClick'] = useCallback(
    ({ key }: any) => {
      if (key === 'recall') {
        handleRecallMessage();
      }
      if (key === 'batchRecall') {
        onBatchRecall?.(message.messageId ?? message.sid);
      }
      if (key === 'mute') {
        handleMute();
      }
      if (key === 'unMute') {
        handleMute(false);
      }
    },
    [message, onBatchRecall, handleRecallMessage, handleMute]
  );

  if (!moreActions.length) return null;

  return (
    <div className={styles['chat-item__message-controls']}>
      <Dropdown
        menu={{
          items: moreActions,
          onClick: handleMoreClick,
        }}
        arrow
        placement="bottomRight"
      >
        <MoreOutlined />
      </Dropdown>
    </div>
  );
};

export default MessageItemControl;
