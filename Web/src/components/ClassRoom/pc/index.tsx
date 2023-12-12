import React from 'react';
import { Spin } from 'antd';
import RoomHeader from './Header';
import TeacherPage from './TeacherPage';
import StudentPage from './StudentPage';
import AssistantPage from './AssistantPage';
import useClassroomStore from '../store';
import './styles.less';

interface IProps {
  initing: boolean;
}

const PCClassRoom: React.FC<IProps> = props => {
  const { initing } = props;
  const { isTeacher, isAssistant, isStudent } = useClassroomStore(
    state => state
  );

  const renderMainAndBottom = () => {
    if (isTeacher) return <TeacherPage />;
    if (isStudent) return <StudentPage />;
    if (isAssistant) return <AssistantPage />;
  };

  return (
    <Spin spinning={initing} wrapperClassName="amaui-classroom">
      <RoomHeader />
      {renderMainAndBottom()}
    </Spin>
  );
};

export default PCClassRoom;
