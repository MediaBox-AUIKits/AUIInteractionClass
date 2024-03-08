import React, { useState, useEffect, useMemo, createContext } from 'react';
import classNames from 'classnames';
import SelfPlayer from '../SelfPlayer';
import ChatBox from './ChatPanel';
import AsideTabs from './AsideTabs';
import AsideAnnouncement from './AsideAnnouncement';
import type { IAsideTabItem } from './AsideTabs';
import MemberList from './MemberList';
import InteractionMembers from './InteractionMembers';
import TeacherInteraction from './TeacherInteraction';
import { ClassroomModeEnum, ClassroomFunction } from '../../types';
import useClassroomStore from '../../store';
import styles from './index.less';

export const AsideContext = createContext({
  canRemoveMessage: false,
  canMuteUser: false,
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
    localMedia,
    isTeacher,
  } = useClassroomStore(state => state);

  const [activeKey, setActiveKey] = useState<AsideTab>(AsideTab.chat);

  const handleTabChange = (key: string) => {
    setActiveKey(key as AsideTab);
  };

  const accessibleFunctions = useClassroomStore(
    state => state.accessibleFunctions
  );
  // 允许删除群消息
  const [canRemoveMessage, setCanRemoveMessage] = useState(false);
  // 允许禁言单人
  const [canMuteUser, setCanMuteUser] = useState(false);
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
      setCanMuteUser(accessibleFunctions.includes(ClassroomFunction.MuteUser));
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
        children: <ChatBox />,
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
          children: <InteractionMembers />,
        });
      }
    }
    return arr;
  }, [isAdmin, mode, activeKey, canManageInteraction]);

  const renderPlayer = () => {
    if (playerType === AsidePlayerTypes.self) {
      return (
        <SelfPlayer
          className={styles['aside__sub-screen']}
          switcherVisible={!localMedia.mediaStream} // 本地插播中不可切换画面，否则会引起推流断流
        />
      );
    }

    if (playerType === AsidePlayerTypes.custom) {
      return customPlayer;
    }

    return null;
  };

  return (
    <aside className={classNames(styles.aside, className)}>
      {renderPlayer()}
      <AsideAnnouncement className={styles['aside__announcement']} />
      <AsideContext.Provider
        value={{
          canRemoveMessage,
          canMuteUser,
          canKickMember,
          canManageInteraction,
        }}
      >
        <AsideTabs
          activeKey={activeKey}
          items={tabs}
          onChange={handleTabChange}
        />
      </AsideContext.Provider>
      {isTeacher ? <TeacherInteraction /> : null}
    </aside>
  );
};

export default RoomAside;
