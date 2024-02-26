import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { Checkbox } from 'antd';
import { DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import MessageItem from './MessageItem';
import EmptyBlock from '../../../components/EmptyBlock';
import toast from '@/utils/toast';
import { useThrottleFn } from 'ahooks';
import { ClassroomStatusEnum, CustomMessageTypes } from '../../../types';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import useClassroomStore from '../../../store';
import { ClassContext } from '../../../ClassContext';
import { AsideContext } from '../index';
import { ChevronsDownSvg } from '../../../components/icons';
import { scrollToBottom } from '../../../utils/common';
import logger, { EMsgid } from '../../../utils/Logger';
import classNames from 'classnames';
import styles from './index.less';

interface IChatPanelProps {
  className?: string;
}

type CheckboxValueType = string | number | boolean;

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
  const {
    messageList,
    commentInput,
    groupMuted,
    selfMuted,
    joinedGroupId,
    setCommentInput,
  } = useClassroomStore(state => state);
  const { status } = useClassroomStore(state => state.classroomInfo);
  const [selectedMessageIds, setSelectedMessageIds] = useState<
    CheckboxValueType[]
  >([]);
  const [enableBatchRecall, setEnableBatchRecall] = useState(false);
  const bottomOperationsActive = useMemo(
    () => enableBatchRecall,
    [enableBatchRecall]
  );
  const { canMuteUser } = useContext(AsideContext);
  const [mutedUserList, setMutedUserList] = useState<string[]>([]);

  const queryMutedUserList = useCallback(async () => {
    const mutedUserList = await auiMessage.queryMutedUserList();
    setMutedUserList(mutedUserList);
  }, [auiMessage]);

  useEffect(() => {
    if (canMuteUser) queryMutedUserList();
  }, [canMuteUser]);

  const handleMuteUserListChange = (data: any) => {
    setMutedUserList(data?.data?.muteUserList ?? []);
  };

  useEffect(() => {
    auiMessage.addListener(
      AUIMessageEvents.onMuteUserListChange,
      handleMuteUserListChange
    );
    return () => {
      auiMessage.removeListener(
        AUIMessageEvents.onMuteUserListChange,
        handleMuteUserListChange
      );
    };
  }, [auiMessage]);

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

  const handleSend = () => {
    const text = commentInput.trim();
    if (!text || sending || !allowChat) {
      return;
    }

    // 自行发消息就执行自动滚动
    autoScroll.current = true;
    setNewTipVisible(false);

    setSending(true);
    logger.reportInvoke(EMsgid.SEND_GROUP_MESSAGE);
    auiMessage
      .sendMessageToGroup({
        type: CustomMessageTypes.Comment,
        skipAudit: true, // 跳过审核，业务方按需配置发送群消息是否走审核
        noStorage: false, // 存储群消息，进教室才能拉取最近群消息（若该教室没人，2分钟后，群消息会被清空）
        data: { content: text },
      })
      .then(() => {
        console.log('发送成功');
        setCommentInput('');
        logger.reportInvokeResult(EMsgid.SEND_GROUP_MESSAGE_RESULT, true);
      })
      .catch((err: any) => {
        toast.error('消息发送失败');
        logger.reportInvokeResult(
          EMsgid.SEND_GROUP_MESSAGE_RESULT,
          false,
          '',
          err
        );
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

  const handleBatchRecallMessage = (messageId: string) => {
    setEnableBatchRecall(true);
    setSelectedMessageIds([messageId]);
  };

  const notifyRemoteGroupMessageRemoved = useCallback(
    (count: number = 1) => {
      auiMessage.sendGroupSignal({
        type: CustomMessageTypes.GroupMessageRemoved,
        data: {
          count,
        },
      });
    },
    [auiMessage]
  );

  const handleRecallMessage = useCallback(
    async (removeMessageId: string, notify = true) => {
      if (!removeMessageId) return;

      logger.reportInvoke(EMsgid.REMOVE_GROUP_MESSAGE, { removeMessageId });
      try {
        await auiMessage.removeMessage({
          messageId: removeMessageId,
        });
        if (notify) {
          toast.success('已删除');
          notifyRemoteGroupMessageRemoved();
        }
        logger.reportInvokeResult(EMsgid.REMOVE_GROUP_MESSAGE_RESULT, true);
      } catch (err) {
        if (notify) toast.error('删除失败');
        logger.reportInvokeResult(
          EMsgid.REMOVE_GROUP_MESSAGE_RESULT,
          false,
          '',
          err
        );
      }
    },
    [auiMessage, notifyRemoteGroupMessageRemoved]
  );

  const doBatchRecallMessage = useCallback(async () => {
    const removeMessageIds = [...selectedMessageIds];
    if (!removeMessageIds.length) return;

    try {
      for (let index = 0; index < removeMessageIds.length; index++) {
        const messageId = removeMessageIds[index];
        await handleRecallMessage(messageId as string, false);
      }
      toast.success('已删除');
      notifyRemoteGroupMessageRemoved(removeMessageIds.length);
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setEnableBatchRecall(false);
      setSelectedMessageIds([]);
    }
  }, [
    selectedMessageIds,
    messageList,
    handleRecallMessage,
    notifyRemoteGroupMessageRemoved,
  ]);

  const handleCancelBottomOperations = useCallback(() => {
    if (enableBatchRecall) setEnableBatchRecall(false);
    setSelectedMessageIds([]);
  }, [enableBatchRecall]);

  const handleChange = useCallback(
    (selected: CheckboxValueType[]) => {
      setSelectedMessageIds(selected);
    },
    [selectedMessageIds]
  );

  return (
    <div className={classNames(styles['chat-panel'], className)}>
      <div
        ref={listRef}
        className={classNames(styles['chat-list'], {
          [styles['bottom-operations-active']]: bottomOperationsActive,
        })}
        onScroll={handleScroll}
      >
        <Checkbox.Group
          className={styles['chat-list__checkbox-group']}
          value={selectedMessageIds}
          onChange={handleChange}
        >
          {messageList.map(item => (
            <MessageItem
              key={item.sid}
              item={item}
              muted={mutedUserList.includes(item.userId)}
              selected={selectedMessageIds.includes(item.messageId ?? item.sid)}
              selecting={bottomOperationsActive}
              onRecall={handleRecallMessage}
              onBatchRecall={handleBatchRecallMessage}
            />
          ))}
        </Checkbox.Group>
        {messageList.length === 0 ? (
          <EmptyBlock
            className={styles['chat-list__empty']}
            text="暂无聊天内容"
          />
        ) : null}
      </div>
      <div
        className={classNames(styles['chat-operations'], {
          [styles['bottom-operations-active']]: bottomOperationsActive,
        })}
      >
        <div
          className={classNames(styles['chat-operations__input'], {
            [styles.hidden]: bottomOperationsActive,
          })}
        >
          <textarea
            ref={ref => (textareaRef.current = ref)}
            value={commentInput}
            disabled={!allowChat}
            placeholder={commentPlaceholder}
            className={styles['chat-operations__input__textarea']}
            onChange={e => setCommentInput(e.target.value)}
            onKeyDown={e => {
              if (e.key !== 'Enter') {
                return;
              }
              e.preventDefault();
              handleSend();
            }}
          />
          <div
            className={classNames(styles['chat-operations__input__send-btn'], {
              disabled: !allowChat,
            })}
            onClick={handleSend}
          >
            发送
          </div>
        </div>
        <div
          className={classNames(styles['chat-operations__bottom'], {
            [styles.active]: bottomOperationsActive,
          })}
        >
          <div
            className={styles['chat-operations__bottom__close']}
            onClick={handleCancelBottomOperations}
          >
            <CloseOutlined />
          </div>
          {enableBatchRecall ? (
            <div
              className={styles['chat-operations__bottom__button']}
              onClick={doBatchRecallMessage}
            >
              <DeleteOutlined
                className={styles['chat-operations__bottom__button__icon']}
              />
              撤回
            </div>
          ) : null}
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
