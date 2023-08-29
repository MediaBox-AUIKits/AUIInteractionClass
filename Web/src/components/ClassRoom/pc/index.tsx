import React, { useMemo, useContext, useEffect } from 'react';
import { Spin } from 'antd';
import RoomMain from './RoomMain';
import RoomHeader from './Header';
import RoomAside from './Aside';
import RoomBottom from './Bottom';
import { ClassroomModeEnum } from '../types';
import useClassroomStore from '../store';
import livePush from '../utils/LivePush';
import { ClassContext } from '../ClassContext';
import './styles.less';

interface IProps {
  initing: boolean;
}

const PCClassRoom: React.FC<IProps> = props => {
  const { initing } = props;
  const livePusher = useMemo(() => {
    return livePush.getInstance('alivc')!;
  }, []);
  const { mode, teacherId } = useClassroomStore(state => state.classroomInfo);
  const { userInfo } = useContext(ClassContext);

  useEffect(() => {
    // 大班课时，老师角色需要创建影子实例
    if (mode === ClassroomModeEnum.Big && userInfo?.userId === teacherId) {
      livePusher.initShadow();
    }
  }, [livePusher, mode, teacherId, userInfo]);

  return (
    <Spin spinning={initing} wrapperClassName="amaui-classroom">
      <RoomHeader />
      <div className="amaui-classroom__body">
        <RoomMain wrapClassName="amaui-classroom__main" />
        <RoomAside className="amaui-classroom__aside" />
      </div>
      <RoomBottom />
    </Spin>
  );
};

export default PCClassRoom;
