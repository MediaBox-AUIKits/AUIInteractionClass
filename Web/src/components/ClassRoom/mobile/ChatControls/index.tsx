import React, {
  useContext,
  useRef,
  useMemo,
  useState,
  KeyboardEvent,
} from 'react';
import classNames from 'classnames';
import { Toast } from 'antd-mobile';
import useClassroomStore from '../../store';
import { ClassContext } from '../../ClassContext';
import { CustomMessageTypes } from '../../types';
import logger, { EMsgid } from '../../utils/Logger';
import styles from './index.less';

interface IChatControlsProps {
  theme?: 'dark' | 'light';
  className?: string;
  heartIconActive?: boolean;
  allowChat: boolean;
}

const ChatControls: React.FC<IChatControlsProps> = props => {
  const { allowChat, className, theme = 'dark' } = props;
  const operationRef = useRef<HTMLDivElement>(null);
  const { auiMessage } = useContext(ClassContext);
  const { commentInput, groupMuted, selfMuted } = useClassroomStore(
    state => state
  );
  const [sending, setSending] = useState<boolean>(false);

  const commentPlaceholder = useMemo(() => {
    let text = '说点什么吧';
    if (groupMuted) {
      text = '全员禁言中';
    } else if (selfMuted) {
      text = '您已被禁言';
    }
    return text;
  }, [groupMuted, selfMuted]);

  const updateCommentInput = (text: string) => {
    const { setCommentInput } = useClassroomStore.getState();
    setCommentInput(text);
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    const text = commentInput.trim();
    if (e.key !== 'Enter' || !text || sending || !allowChat) {
      return;
    }
    e.preventDefault();

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
        updateCommentInput('');
        logger.reportInvokeResult(EMsgid.SEND_GROUP_MESSAGE_RESULT, true);
      })
      .catch((err: any) => {
        Toast.show({
          content: '消息发送失败',
          icon: 'fail',
        });
        logger.reportInvokeResult(
          EMsgid.SEND_GROUP_MESSAGE_RESULT,
          false,
          '',
          err
        );
      })
      .finally(() => {
        setSending(false);
      });
  };

  const touchInputHandler = () => {
    // 解决发送双击问题，增加scrollIntoView
    operationRef.current?.scrollIntoView(false);
  };

  return (
    <div
      className={classNames(styles['chat-controls'], className, {
        [styles['chat-controls-light']]: theme === 'light',
      })}
      ref={operationRef}
    >
      <form
        action=""
        className="chat-input-form"
        style={{ visibility: allowChat ? 'visible' : 'hidden' }}
        onSubmit={(e: any) => e.preventDefault()}
      >
        <input
          type="text"
          enterKeyHint="send"
          className="chat-input"
          placeholder={commentPlaceholder}
          value={commentInput}
          disabled={!allowChat || sending || groupMuted || selfMuted}
          onKeyDown={handleKeydown}
          onChange={e => updateCommentInput(e.target.value)}
          onTouchStart={touchInputHandler}
        />
      </form>
    </div>
  );
};

export default ChatControls;
