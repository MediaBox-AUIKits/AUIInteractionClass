import React, { useCallback, useContext } from 'react';
import classNames from 'classnames';
import useClassroomStore from '../../store';
import NeteaseBoard from '../../components/Whiteboard/NeteaseBoard';
import PCMainWrap from '../../components/PCMainWrap';
import SharingMask from './SharingMask';
import LocalPlayer from './LocalPlayer';
import PermissionVerificationWrap from '../../components/PermissionVerificationWrap';
import { ClassContext } from '../../ClassContext';
import { ClassroomFunction } from '../../types';
import styles from './styles.less';

interface IProps {
  wrapClassName?: string;
  whiteBoardActivated: boolean;
  children: React.ReactNode;
}

const RoomMain: React.FC<IProps> = props => {
  const { wrapClassName, whiteBoardActivated, children } = props;
  const { cooperationManager } = useContext(ClassContext);
  const { isAdmin } = useClassroomStore(state => state);

  const handleDocsUpdated = useCallback(() => {
    cooperationManager?.syncDocsUpdated();
  }, [cooperationManager]);

  return (
    <PCMainWrap className={classNames(wrapClassName, styles['room-main'])}>
      <PermissionVerificationWrap
        functionsVerificationMap={{
          canTurnPage: ClassroomFunction.WhiteboardPageTurner,
          canUpdateCourceware: ClassroomFunction.UpdateCourceware,
        }}
      >
        {whiteBoardActivated ? (
          <NeteaseBoard
            canControl={isAdmin}
            onDocsUpdated={handleDocsUpdated}
          />
        ) : (
          children
        )}
      </PermissionVerificationWrap>

      <LocalPlayer />

      <SharingMask />
    </PCMainWrap>
  );
};

export default RoomMain;
