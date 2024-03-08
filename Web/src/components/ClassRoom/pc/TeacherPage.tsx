import React, { useMemo, useEffect, useContext, Fragment } from 'react';
import TeacherCooperation from '../components/TeacherCooperation';
import RoomMain from './RoomMain';
import RoomInteractionList from './InteractionList';
import RoomAside, { AsidePlayerTypes } from './Aside';
import PCAsideScreenWrapper from '../components/PCAsideScreenWrapper';
import RoomBottom from './Bottom';
import LocalPlayer from './RoomMain/LocalPlayer';
import SharingMask from './RoomMain/SharingMask';
import NeteaseBoard from '../components/Whiteboard/NeteaseBoard';
import { ClassroomModeEnum } from '../types';
import useClassroomStore from '../store';
import livePush from '../utils/LivePush';
import './styles.less';

const PCClassRoom: React.FC = () => {
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const {
    classroomInfo: { mode },
    localMedia,
    cameraIsSubScreen,
  } = useClassroomStore(state => state);

  useEffect(() => {
    // 大班课时，老师角色需要创建影子实例
    if (mode === ClassroomModeEnum.Big) {
      livePusher.initShadow();
    }
  }, [livePusher, mode]);

  const asideWhiteboard = useMemo(
    () => (
      // 本地插播中不可切换画面，否则会引起推流断流
      <PCAsideScreenWrapper switcherVisible={!localMedia.mediaStream}>
        <>
          {/* 白板为次画面，隐藏控件 */}
          <NeteaseBoard
            wrapClassName="amaui-classroom__aside__sub_screen"
            canControl={false}
            canTurnPage={false}
            canUpdateCourceware={false}
            setAsBroadcaster
          />
          <LocalPlayer />
          <SharingMask minify={true} style={{ zIndex: 0 }} />
        </>
      </PCAsideScreenWrapper>
    ),
    [localMedia.mediaStream]
  );

  return (
    <Fragment>
      <div className="amaui-classroom__body">
        <div className="amaui-classroom__main">
          <RoomInteractionList
            isTeacher
            wrapClassName="amaui-classroom__main__speaker"
          />
          <RoomMain wrapClassName="amaui-classroom__main__content" />
        </div>

        <RoomAside
          className="amaui-classroom__aside"
          playerType={
            cameraIsSubScreen ? AsidePlayerTypes.self : AsidePlayerTypes.custom
          }
          customPlayer={cameraIsSubScreen ? null : asideWhiteboard}
        />
      </div>
      <RoomBottom />
      <TeacherCooperation />
    </Fragment>
  );
};

export default PCClassRoom;
