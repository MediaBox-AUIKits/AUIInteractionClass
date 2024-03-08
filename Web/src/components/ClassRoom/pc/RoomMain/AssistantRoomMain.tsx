import React from 'react';
import classNames from 'classnames';
import PCMainWrap from '../../components/PCMainWrap';
import SharingMask from './SharingMask';
import LocalPlayer from './LocalPlayer';
import PermissionVerificationWrap from '../../components/PermissionVerificationWrap';
import { ClassroomFunction } from '../../types';
import styles from './styles.less';

interface IProps {
  wrapClassName?: string;
  whiteBoardActivated: boolean;
  children: React.ReactNode;
}

const RoomMain: React.FC<IProps> = props => {
  const { wrapClassName, children } = props;

  return (
    <PCMainWrap className={classNames(wrapClassName, styles['room-main'])}>
      <PermissionVerificationWrap
        functionsVerificationMap={{
          canTurnPage: ClassroomFunction.WhiteboardPageTurner,
          canUpdateCourceware: ClassroomFunction.UpdateCourceware,
        }}
      >
        {children}
      </PermissionVerificationWrap>

      <LocalPlayer />

      <SharingMask />
    </PCMainWrap>
  );
};

export default RoomMain;
