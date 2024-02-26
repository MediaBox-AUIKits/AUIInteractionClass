import React from 'react';
import { Checkbox } from 'antd';
import MessageItemControl from './MessageItemControl';
import useClassroomStore from '@/components/ClassRoom/store';
import { CommentMessage } from '@/components/ClassRoom/types';
import classNames from 'classnames';
import styles from './index.less';

interface IMessageItemProps {
  item: CommentMessage;
  muted?: boolean;
  selected?: boolean;
  selectDisabled?: boolean;
  selecting?: boolean;
  onRecall: (messageId: string) => void;
  onBatchRecall?: (messageId: string) => void;
}

const MessageItem: React.FC<IMessageItemProps> = props => {
  const {
    item,
    muted,
    selected = false,
    selecting = false,
    selectDisabled = false,
    onRecall,
    onBatchRecall,
  } = props;
  const {
    classroomInfo: { assistantId },
  } = useClassroomStore(state => state);

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
    <div
      key={item.messageId}
      className={classNames(styles['chat-item'], {
        [styles.checked]: selected,
      })}
    >
      <div className={styles['chat-item__header']}>
        <div className={styles['chat-item__header__nickname']}>
          {renderTag(item)}
          <span>{item.nickName}:</span>
        </div>

        {selecting ? (
          <Checkbox
            value={item.messageId ?? item.sid}
            disabled={selectDisabled}
          />
        ) : (
          <MessageItemControl
            muted={muted}
            message={item}
            onRecall={onRecall}
            onBatchRecall={onBatchRecall}
          />
        )}
      </div>
      <div className={styles['chat-item-content']}>{item.content}</div>
    </div>
  );
};

export default MessageItem;
