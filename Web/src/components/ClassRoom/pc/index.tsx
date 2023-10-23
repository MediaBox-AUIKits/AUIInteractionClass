import React, { useMemo, useContext, useEffect, Fragment } from 'react';
import { Spin } from 'antd';
import RoomMain from './RoomMain';
import RoomHeader from './Header';
import RoomInteractionList from './InteractionList';
import RoomAside, { AsidePlayerTypes } from './Aside';
import RoomBottom from './Bottom';
import StudentPage from './StudentPage';
import { ClassroomModeEnum, UserRoleEnum } from '../types';
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

  const renderMainAndBottom = () => {
    // 老师身份返回这部分
    if (userInfo?.role === UserRoleEnum.Teacher) {
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
        </Fragment>
      );
    }
    // 学生身份
    if (userInfo?.role === UserRoleEnum.Student) {
      return <StudentPage />;
    }
    // TODO: 助教
  };

  return (
    <Spin spinning={initing} wrapperClassName="amaui-classroom">
      <RoomHeader />
      {renderMainAndBottom()}
    </Spin>
  );
};

export default PCClassRoom;
