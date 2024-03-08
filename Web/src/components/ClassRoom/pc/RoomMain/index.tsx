import React from 'react';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import NeteaseBoard from '../../components/Whiteboard/NeteaseBoard';
import PCMainWrap from '../../components/PCMainWrap';
import SharingMask from './SharingMask';
import LocalPlayer from './LocalPlayer';
import SelfPlayer from '../SelfPlayer';
import styles from './styles.less';

interface IProps {
  wrapClassName?: string;
}

const RoomMain: React.FC<IProps> = props => {
  const { wrapClassName } = props;
  const { isAdmin, cameraIsSubScreen } = useClassroomStore(state => state);

  return (
    <PCMainWrap className={classNames(wrapClassName, styles['room-main'])}>
      {cameraIsSubScreen ? (
        <>
          <NeteaseBoard
            canControl={isAdmin}
            canTurnPage
            canUpdateCourceware
            setAsBroadcaster
          />
          <LocalPlayer />
          <SharingMask />
        </>
      ) : (
        <SelfPlayer switcherVisible={false} />
      )}
    </PCMainWrap>
  );
};

export default RoomMain;
