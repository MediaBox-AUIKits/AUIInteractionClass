import React, { useState, useRef, useEffect } from 'react';
import { useThrottleFn } from 'ahooks';
import classNames from 'classnames';
import useClassroomStore from '../store';
import { ChevronsDownSvg } from '../components/icons';
import EmptyBlock from '../components/EmptyBlock';
import { scrollToBottom } from '../utils/common';
import styles from './ChatPanel.less';

// 距离聊天列表底部最大值
const MaxBottomDistance = 60;

interface IChatPanelProps {
  className: string;
  hidden?: boolean;
}

const ChatPanel: React.FC<IChatPanelProps> = props => {
  const { className, hidden = false } = props;
  const messageList = useClassroomStore(state => state.messageList);
  const { assistantId } = useClassroomStore(state => state.classroomInfo);
  const autoScroll = useRef<boolean>(true);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [newTipVisible, setNewTipVisible] = useState<boolean>(false);

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

  useEffect(() => {
    // 切换至聊天模块后自动滚动都最新
    if (!hidden) {
      handleNewTipClick();
    }
  }, [hidden]);

  return (
    <div
      className={classNames(className, styles['chat-panel'])}
      style={{
        display: hidden ? 'none' : 'block',
      }}
    >
      <ul
        ref={listRef}
        className={styles['chat-list']}
        onWheelCapture={handleScroll}
        onScroll={handleScroll}
      >
        {messageList.map((data, index: number) => (
          <li className={styles['chat-item']} key={data.messageId || index}>
            {data.isTeacher ? (
              <span className={styles['chat-item__anchor']}>老师</span>
            ) : null}
            {data.isAssistant || assistantId === data.userId ? (
              <span className={styles['chat-item__assistant']}>助教</span>
            ) : null}
            {data.isSelf ? (
              <span className={styles['chat-item__self']}>我</span>
            ) : null}
            {data.nickName ? (
              <span className={styles['chat-item__nick']}>
                {data.nickName + ':'}
              </span>
            ) : null}
            <span>{data.content}</span>
          </li>
        ))}
      </ul>

      {messageList.length === 0 ? (
        <EmptyBlock
          className={styles['chat-list__empty']}
          text="暂无聊天内容"
        />
      ) : null}

      <div
        className={styles['chat-new__tip']}
        style={{ display: newTipVisible ? 'inline-block' : 'none' }}
        onClick={handleNewTipClick}
      >
        <ChevronsDownSvg /> 您有新消息
      </div>
    </div>
  );
};

export default ChatPanel;
