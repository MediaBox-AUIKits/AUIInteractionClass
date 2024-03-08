/**
 * 该文件为 PC 助教端底部组件
 */
import React from 'react';
import PermissionVerificationWrap from '@/components/ClassRoom/components/PermissionVerificationWrap';
import Board from './Board';
import Doc from './Doc';
import Tools from './Tools';
import Setting from './Setting';
import InteractionApplication from './InteractionApplication';
import { ClassroomFunction } from '../../types';
import styles from './index.less';

interface IProps {
  whiteBoardActivated: boolean;
}

const AssistantBottom: React.FC<IProps> = (props: IProps) => {
  const { whiteBoardActivated } = props;
  return (
    <div className={styles['pc-bottom']}>
      <div className={styles['center-part']}>
        {/* 白板 */}
        <Board disabled={!whiteBoardActivated} />

        {/* 上传课件（有权限校验） */}
        <PermissionVerificationWrap
          functionKey={ClassroomFunction.UpdateCourceware}
        >
          <Doc disabled={!whiteBoardActivated} />
        </PermissionVerificationWrap>

        {/* 设置（有权限校验） */}
        <PermissionVerificationWrap
          functionsVerificationMap={{
            canMuteGroup: ClassroomFunction.MuteGroup,
            canMuteInteraction: ClassroomFunction.MuteInteraction,
            canAllowInteraction: ClassroomFunction.AllowInteraction,
          }}
        >
          <Setting />
        </PermissionVerificationWrap>

        {/* 教学工具（有权限校验） */}
        <PermissionVerificationWrap
          functionsVerificationMap={{
            canUpdateAnnouncement: ClassroomFunction.EditAnnouncement,
            canManageCheckIn: ClassroomFunction.CheckInManagement,
          }}
        >
          <Tools />
        </PermissionVerificationWrap>

        {/* 连麦申请（有权限校验） */}
        <PermissionVerificationWrap
          functionKey={ClassroomFunction.InteractionManagement}
        >
          <InteractionApplication />
        </PermissionVerificationWrap>
      </div>
    </div>
  );
};

export default AssistantBottom;
