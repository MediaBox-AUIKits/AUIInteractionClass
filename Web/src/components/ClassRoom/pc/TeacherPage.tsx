import React, { useMemo, useEffect, Fragment } from 'react';
import TeacherCooperation from '../components/TeacherCooperation';
import RoomMain from './RoomMain';
import RoomInteractionList from './InteractionList';
import RoomAside, { AsidePlayerTypes } from './Aside';
import RoomBottom from './Bottom';
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
  } = useClassroomStore(state => state);

  useEffect(() => {
    // 大班课时，老师角色需要创建影子实例
    if (mode === ClassroomModeEnum.Big) {
      livePusher.initShadow();
    }
  }, [livePusher, mode]);
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
          playerType={AsidePlayerTypes.self}
        />
      </div>
      <RoomBottom />
      <TeacherCooperation />
    </Fragment>
  );
};

export default PCClassRoom;
