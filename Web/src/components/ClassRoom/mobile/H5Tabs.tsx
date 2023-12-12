import React, {
  ReactNode,
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import classNames from 'classnames';
import { ClassContext } from '../ClassContext';
import { CustomMessageTypes } from '../types';
import { AUIMessageEvents } from '@/BaseKits/AUIMessage/types';
import styles from './index.less';

export const CameraTabKey = 'camera';
export const MaterialTabKey = 'material';
export const IntroTabKey = 'intro';
export const ChatTabKey = 'chat';
const TabTextMap: any = {
  [CameraTabKey]: '摄像头',
  [MaterialTabKey]: '白板/课件',
  [IntroTabKey]: '简介',
  [ChatTabKey]: '聊天',
};
const MaxCount = 99;

interface TabOptions {
  key: string;
  before?: ReactNode;
}
interface IH5Tabs {
  value: string;
  tabs: TabOptions[];
  onChange: (tab: string) => void;
}

const H5Tabs: React.FC<IH5Tabs> = (props: IH5Tabs) => {
  const { value, tabs, onChange } = props;
  const { auiMessage } = useContext(ClassContext);
  const [newMsgCount, setNewMsgCount] = useState<number>(0);
  const newMsgCountRef = useRef<number>(0);
  const increaseTimer = useRef<NodeJS.Timer>(); // 节流

  const newMsgCountText = useMemo(() => {
    if (newMsgCount > MaxCount) {
      return `${MaxCount}+`;
    }
    return `${newMsgCount}`;
  }, [newMsgCount]);

  const increaseNewMsgCount = useCallback(() => {
    newMsgCountRef.current += 1;

    if (increaseTimer.current) {
      return;
    }
    // 节流
    increaseTimer.current = setTimeout(() => {
      setNewMsgCount(newMsgCountRef.current);
      increaseTimer.current = undefined;
    }, 500);
  }, []);

  useEffect(() => {
    if (!auiMessage) {
      return;
    }

    const handler = (eventData: any) => {
      const { type } = eventData || {};
      if (type === CustomMessageTypes.Comment) {
        increaseNewMsgCount();
      }
    };

    if (tabs.find(({ key }) => key === ChatTabKey) && value !== ChatTabKey) {
      auiMessage.addListener(AUIMessageEvents.onMessageReceived, handler);
    } else {
      auiMessage.removeListener(AUIMessageEvents.onMessageReceived, handler);
      newMsgCountRef.current = 0;
      setNewMsgCount(0);
    }

    return () => {
      auiMessage.removeListener(AUIMessageEvents.onMessageReceived, handler);
    };
  }, [auiMessage, tabs, value]);

  return (
    <div className={styles.h5tabs}>
      {tabs.map(({ key, before }) => (
        <span
          key={key}
          className={classNames(styles['h5tabs-item'], {
            [styles['h5tabs-item-active']]: value === key && tabs.length > 1,
          })}
          style={
            before
              ? {
                  flexBasis: '40%',
                }
              : undefined
          }
          onClick={() => onChange(key)}
        >
          {before}
          <div className={styles['h5tabs-item-text-wrapper']}>
            <div className={styles['h5tabs-item-text']}>
              {TabTextMap[key]}
              {key === ChatTabKey && newMsgCount ? (
                <span className={styles['h5tabs-item__badge']}>
                  {newMsgCountText}
                </span>
              ) : null}
            </div>
          </div>
        </span>
      ))}
    </div>
  );
};

export default H5Tabs;
