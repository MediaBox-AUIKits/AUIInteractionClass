import React, { useCallback, useContext } from 'react';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import NeteaseBoard from '../../components/Whiteboard/NeteaseBoard';
import PCMainWrap from '../../components/PCMainWrap';
import SharingMask from './SharingMask';
import LocalPlayer from './LocalPlayer';
import { ClassContext } from '../../ClassContext';
import styles from './styles.less';

interface IProps {
  wrapClassName?: string;
}

const RoomMain: React.FC<IProps> = props => {
  const { wrapClassName } = props;
  const { cooperationManager } = useContext(ClassContext);
  const { isAdmin } = useClassroomStore(state => state);

  const handleDocsUpdated = useCallback(() => {
    cooperationManager?.syncDocsUpdated();
  }, [cooperationManager]);

  return (
    <PCMainWrap className={classNames(wrapClassName, styles['room-main'])}>
      <NeteaseBoard
        canControl={isAdmin}
        canTurnPage
        onDocsUpdated={handleDocsUpdated}
      />

      <LocalPlayer />

      <SharingMask />
    </PCMainWrap>
  );
};

export default RoomMain;
