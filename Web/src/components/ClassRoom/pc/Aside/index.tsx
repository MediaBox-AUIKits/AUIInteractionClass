import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import classNames from 'classnames';
import SelfPlayer from '../SelfPlayer';
import ChatBox from '../ChatPanel';
import AsideTabs from './AsideTabs';
import type { IAsideTabItem } from './AsideTabs';
import MemberList from './MemberList';
import InteractionMembers from './InteractionMembers';
import TeacherInteraction from './TeacherInteraction';
import { UserRoleEnum, ClassroomModeEnum } from '../../types';
import { ClassContext } from '../../ClassContext';
import useClassroomStore from '../../store';
import styles from './index.less';

export enum AsidePlayerTypes {
  self = 'self',
  custom = 'custom',
  none = 'none',
}

enum AsideTab {
  chat = 'chat',
  members = 'members',
  connected = 'connected',
}

interface IRoomAsideProps {
  className?: string;
  playerType?: AsidePlayerTypes;
  customPlayer?: React.ReactNode;
}

const RoomAside: React.FC<IRoomAsideProps> = props => {
  const { className, playerType = AsidePlayerTypes.none, customPlayer } = props;
  const { userInfo } = useContext(ClassContext);
  const {
    classroomInfo: { mode },
    applyingList,
  } = useClassroomStore(state => state);
  const [activeKey, setActiveKey] = useState<AsideTab>(AsideTab.chat);
  const [applyingNumUpdated, setApplyingNumUpdated] = useState(false);
  const [applyingListReaded, setApplyingListReaded] = useState(false);

  useEffect(() => {
    const sub = useClassroomStore.subscribe(
      state => state.applyingList,
      (list, preList) => {
        const snapshot = list.map(({ userId }) => userId).join(',');
        const prevSnapshot = preList.map(({ userId }) => userId).join(',');
        console.log({
          snapshot,
          prevSnapshot,
        });
        setApplyingNumUpdated(
          activeKey !== AsideTab.connected &&
            snapshot !== prevSnapshot &&
            list.length > 0
        );
        setApplyingListReaded(
          activeKey === AsideTab.connected || snapshot === prevSnapshot
        );
      }
    );
    return sub;
  }, [activeKey]);

  const handleTabChange = useCallback(
    (key: string) => {
      if (
        key === AsideTab.connected &&
        applyingList.length > 0 &&
        applyingNumUpdated
      ) {
        setApplyingListReaded(true);
      }
      setActiveKey(key as AsideTab);
    },
    [applyingList, applyingNumUpdated]
  );

  const tabs = useMemo(() => {
    const arr: IAsideTabItem[] = [
      {
        key: AsideTab.chat,
        label: '成员讨论',
        children: <ChatBox />,
      },
    ];
    if (userInfo?.role === UserRoleEnum.Teacher) {
      arr.push({
        key: AsideTab.members,
        label: '成员列表',
        children: <MemberList visible={activeKey === AsideTab.members} />,
      });
      if (mode !== ClassroomModeEnum.Open) {
        arr.push({
          key: AsideTab.connected,
          label: '连麦成员',
          labelTag:
            applyingNumUpdated && !applyingListReaded ? (
              <div className={styles['aside__tabs__nav__item__tag']}>
                {applyingList.length}
              </div>
            ) : null,
          children: <InteractionMembers />,
        });
      }
    }
    return arr;
  }, [
    userInfo,
    mode,
    activeKey,
    applyingList,
    applyingNumUpdated,
    applyingListReaded,
  ]);

  const renderPlayer = () => {
    if (playerType === AsidePlayerTypes.self) {
      return <SelfPlayer className={styles['aside__player']} />;
    }

    if (playerType === AsidePlayerTypes.custom) {
      return customPlayer;
    }

    return null;
  };

  return (
    <aside className={classNames(styles.aside, className)}>
      {renderPlayer()}
      <AsideTabs
        activeKey={activeKey}
        items={tabs}
        onChange={handleTabChange}
      />
      {userInfo?.role === UserRoleEnum.Teacher ? <TeacherInteraction /> : null}
    </aside>
  );
};

export default RoomAside;
