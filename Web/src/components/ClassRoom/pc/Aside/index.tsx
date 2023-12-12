import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
} from 'react';
import classNames from 'classnames';
import SelfPlayer from '../SelfPlayer';
import ChatBox from '../ChatPanel';
import AsideTabs from './AsideTabs';
import type { IAsideTabItem } from './AsideTabs';
import MemberList from './MemberList';
import InteractionMembers from './InteractionMembers';
import TeacherInteraction from './TeacherInteraction';
import { ClassroomModeEnum, ClassroomFunction } from '../../types';
import useClassroomStore from '../../store';
import styles from './index.less';

export const MemberListContext = createContext({
  canKickMember: false,
  canManageInteraction: false,
});

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
  const {
    isAdmin,
    classroomInfo: { mode },
    isTeacher,
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

  const accessibleFunctions = useClassroomStore(
    state => state.accessibleFunctions
  );
  // 允许删除群消息
  const [canRemoveMessage, setCanRemoveMessage] = useState(false);
  // 允许帮助管理连麦（邀请、应答申请、下麦、设备控制）
  const [canManageInteraction, setCanInteractionManagement] = useState(false);
  // 移出教室
  const [canKickMember, setCanKickMember] = useState(false);

  // 删除群消息
  useEffect(() => {
    if (isAdmin) {
      setCanRemoveMessage(
        accessibleFunctions.includes(ClassroomFunction.RemoveGroupMessage)
      );
      setCanInteractionManagement(
        accessibleFunctions.includes(ClassroomFunction.InteractionManagement)
      );
      setCanKickMember(
        accessibleFunctions.includes(ClassroomFunction.KickMember)
      );
    }
  }, [accessibleFunctions, isAdmin]);

  const tabs = useMemo(() => {
    const arr: IAsideTabItem[] = [
      {
        key: AsideTab.chat,
        label: '成员讨论',
        children: <ChatBox canRemoveMessage={canRemoveMessage} />,
      },
    ];
    if (isAdmin) {
      arr.push({
        key: AsideTab.members,
        label: '成员列表',
        children: <MemberList visible={activeKey === AsideTab.members} />,
      });
      if (mode !== ClassroomModeEnum.Open && canManageInteraction) {
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
    isAdmin,
    mode,
    activeKey,
    applyingList,
    applyingNumUpdated,
    applyingListReaded,
    canRemoveMessage,
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
      <MemberListContext.Provider
        value={{
          canKickMember,
          canManageInteraction,
        }}
      >
        <AsideTabs
          activeKey={activeKey}
          items={tabs}
          onChange={handleTabChange}
        />
      </MemberListContext.Provider>
      {isTeacher ? <TeacherInteraction /> : null}
    </aside>
  );
};

export default RoomAside;
