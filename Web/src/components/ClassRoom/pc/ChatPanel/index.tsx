import React, { useRef, useState, useMemo, useEffect, useContext } from 'react';
import classNames from 'classnames';
import { useThrottleFn } from 'ahooks';
import toast from '@/utils/toast';
import { ClassContext } from '../../ClassContext';
import { ClassroomStatusEnum, CustomMessageTypes } from '../../types';
import useClassroomStore from '../../store';
import { ChevronsDownSvg } from '../../components/icons';
import { scrollToBottom } from '../../utils/common';
import logger from '../../utils/Logger';
import EmptyBlock from '../../components/EmptyBlock';
import styles from './index.less';

interface IChatPanelProps {
  className?: string;
}

// 距离聊天列表底部最大值
const MaxBottomDistance = 60;

const ChatPanel: React.FC<IChatPanelProps> = props => {
  const { className } = props;
  const { auiMessage } = useContext(ClassContext);
  const textareaRef = useRef<HTMLTextAreaElement | null>();
  const autoScroll = useRef<boolean>(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [newTipVisible, setNewTipVisible] = useState<boolean>(false);
  const { messageList, commentInput, groupMuted, selfMuted, joinedGroupId } =
    useClassroomStore(state => state);
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
      })
      .catch((err: any) => {
        toast.error('消息发送失败');
        logger.sendMessageError(err);
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
              {item.isTeacher ? (
                <span className={styles['chat-item-anchor-tag']}>
                  老师{item.isSelf ? '(我)' : ''}
                </span>
              ) : item.isSelf ? (
                <span className={styles['chat-item-anchor-tag']}>我</span>
              ) : null}
              <span>{item.nickName}:</span>
            </div>
            <div className={styles['chat-item-content']}>{item.content}</div>
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
