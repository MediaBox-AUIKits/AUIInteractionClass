import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { Button } from 'antd';
import classNames from 'classnames';
import { useThrottleFn } from 'ahooks';
import toast from '@/utils/toast';
import { ClassContext } from '../../ClassContext';
import {
  ClassroomStatusEnum,
  CommentMessage,
  CustomMessageTypes,
} from '../../types';
import useClassroomStore from '../../store';
import { ChevronsDownSvg } from '../../components/icons';
import { scrollToBottom } from '../../utils/common';
import logger, { EMsgid } from '../../utils/Logger';
import EmptyBlock from '../../components/EmptyBlock';
import styles from './index.less';

interface IChatPanelProps {
  className?: string;
  canRemoveMessage?: boolean;
}

// 距离聊天列表底部最大值
const MaxBottomDistance = 60;

const ChatPanel: React.FC<IChatPanelProps> = props => {
  const { className, canRemoveMessage = false } = props;
  const { auiMessage } = useContext(ClassContext);
  const textareaRef = useRef<HTMLTextAreaElement | null>();
  const autoScroll = useRef<boolean>(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [newTipVisible, setNewTipVisible] = useState<boolean>(false);
  const {
    classroomInfo: { assistantId },
    messageList,
    commentInput,
    groupMuted,
    selfMuted,
    joinedGroupId,
  } = useClassroomStore(state => state);
  const { status } = useClassroomStore(state => state.classroomInfo);

  const allowChat = useMemo(() => {
    // 未上课、上课中时允许使用聊天功能，且非发送中、禁言中
    return (
      [ClassroomStatusEnum.not_start, ClassroomStatusEnum.started].includes(
        status
      ) &&
      !sending &&
      !groupMuted &&
      !selfMuted &&
      !!joinedGroupId
    );
  }, [status, sending, groupMuted, selfMuted, joinedGroupId]);

  const commentPlaceholder = useMemo(() => {
    let text = '说点什么~';
    if (groupMuted) {
      text = '全员禁言中';
    } else if (selfMuted) {
      text = '您已被禁言';
    } else if (status === ClassroomStatusEnum.ended) {
      text = '课程已结束';
    }
    return text;
  }, [groupMuted, selfMuted, status]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    // 不允许自动滚动底部时不执行滚动，但显示新消息提示
    if (!autoScroll.current) {
      setNewTipVisible(true);
      return;
    }
    // 有新消息滚动到底部
    scrollToBottom(listRef.current);
  }, [messageList]);

  const updateCommentInput = (text: string) => {
    useClassroomStore.getState().setCommentInput(text);
  };

  const handleSent = () => {
    const text = commentInput.trim();
    if (!text || sending || !allowChat) {
      return;
    }

    // 自行发消息就执行自动滚动
    autoScroll.current = true;
    setNewTipVisible(false);

    setSending(true);
    logger.reportInvoke(EMsgid.SEND_MESSAGE);
    auiMessage
      .sendMessageToGroup({
        groupId: joinedGroupId,
        type: CustomMessageTypes.Comment,
        skipAudit: true,
        data: { content: text },
      })
      .then(() => {
        console.log('发送成功');
        updateCommentInput('');
        logger.reportInvokeResult(EMsgid.SEND_MESSAGE_RESULT, true);
      })
      .catch((err: any) => {
        toast.error('消息发送失败');
        logger.reportInvokeResult(EMsgid.SEND_MESSAGE_RESULT, false, '', err);
      })
      .finally(() => {
        setSending(false);
        // 发送结束后聚焦输入框
        setTimeout(() => {
          textareaRef.current && textareaRef?.current.focus();
        }, 0);
      });
  };

  const { run: handleScroll } = useThrottleFn(
    () => {
      if (!listRef.current) {
        return;
      }
      const dom = listRef.current;
      const diff = dom.scrollHeight - (dom.clientHeight + dom.scrollTop);
      // 与聊天列表底部的距离大于最大值，不允许自动滚动
      autoScroll.current = diff < MaxBottomDistance;
      // console.log('onWheelCapture', autoScroll.current, diff);
      // 若小于最大值需要隐藏新消息提示
      if (autoScroll.current) {
        setNewTipVisible(false);
      }
    },
    {
      wait: 500,
    }
  );

  const handleNewTipClick = () => {
    if (!listRef.current) {
      return;
    }
    setNewTipVisible(false);
    scrollToBottom(listRef.current);
    autoScroll.current = true;
  };

  const handleRemoveMessage = useCallback(
    (item: CommentMessage) => () => {
      if (!item.sid || !canRemoveMessage) return;

      logger.reportInvoke(EMsgid.REMOVE_MESSAGE);
      auiMessage
        .removeMessages({
          groupId: joinedGroupId,
          type: CustomMessageTypes.RemoveComment,
          skipAudit: true,
          data: {
            notify: true,
            removeSids: item.sid,
          },
        })
        .then(() => {
          toast.success('已删除');
          logger.reportInvokeResult(EMsgid.REMOVE_MESSAGE_RESULT, true);
        })
        .catch((err: any) => {
          toast.error('删除失败');
          logger.reportInvokeResult(
            EMsgid.REMOVE_MESSAGE_RESULT,
            false,
            '',
            err
          );
        });
    },
    [auiMessage, canRemoveMessage]
  );

  const renderRemoveButton = useCallback(
    (item: CommentMessage) => {
      if (!canRemoveMessage) return;

      return (
        <Button
          className={styles['chat-item-content__remove-button']}
          type="text"
          onClick={handleRemoveMessage(item)}
        >
          删除
        </Button>
      );
    },
    [canRemoveMessage, handleRemoveMessage]
  );

  const renderTag = (item: CommentMessage) => {
    const { isAssistant, isTeacher, isSelf, userId } = item;
    // 助教如果较晚加入课堂，则初始化消息列表时无法确定助教 userId
    if (isAssistant || userId === assistantId)
      return (
        <span className={styles['chat-item-anchor-tag__assistant']}>
          助教{item.isSelf ? '(我)' : ''}
        </span>
      );
    if (isTeacher)
      return (
        <span className={styles['chat-item-anchor-tag']}>
          老师{item.isSelf ? '(我)' : ''}
        </span>
      );
    if (isSelf)
      return <span className={styles['chat-item-anchor-tag']}>我</span>;
  };

  return (
    <div className={classNames(styles['chat-panel'], className)}>
      <div
        ref={listRef}
        className={styles['chat-list']}
        onScroll={handleScroll}
      >
        {messageList.map(item => (
          <div key={item.messageId} className={styles['chat-item']}>
            <div className={styles['chat-item-nickname']}>
              {renderTag(item)}
              <span>{item.nickName}:</span>
            </div>
            <div className={styles['chat-item-content']}>
              {item.content}
              {renderRemoveButton(item)}
            </div>
          </div>
        ))}
        {messageList.length === 0 ? (
          <EmptyBlock
            className={styles['chat-list__empty']}
            text="暂无聊天内容"
          />
        ) : null}
      </div>
      <div className={styles['chat-opetations']}>
        <textarea
          ref={ref => (textareaRef.current = ref)}
          value={commentInput}
          disabled={!allowChat}
          placeholder={commentPlaceholder}
          className={styles['chat-textarea']}
          onChange={e => updateCommentInput(e.target.value)}
          onKeyDown={e => {
            if (e.key !== 'Enter') {
              return;
            }
            e.preventDefault();
            handleSent();
          }}
        />
        <div
          className={classNames(styles['chat-send-btn'], {
            disabled: !allowChat,
          })}
          onClick={handleSent}
        >
          发送
        </div>
      </div>

      <div
        className={styles['chat-new-tip']}
        style={{ display: newTipVisible ? 'block' : 'none' }}
        onClick={handleNewTipClick}
      >
        <ChevronsDownSvg /> 您有新消息
      </div>
    </div>
  );
};

export default ChatPanel;
