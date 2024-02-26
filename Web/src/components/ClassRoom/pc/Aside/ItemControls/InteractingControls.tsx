import React, {
  useCallback,
  useMemo,
  useContext,
  useState,
  useEffect,
} from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import KickMember from '../KickMember';
import { MoreOutlined } from '@ant-design/icons';
import {
  MicCloseSvg,
  MicLoadingSvg,
  MicNormalSvg,
  CameraCloseSvg,
  CameraLoadingSvg,
  CameraNormalSvg,
} from '@/components/ClassRoom/components/icons';
import { ClassContext } from '@/components/ClassRoom/ClassContext';
import { ControlsContext } from '../MemberItem';
import { AsideContext } from '../index';
import useClassroomStore from '@/components/ClassRoom/store';
import {
  TeacherInteractionManager,
  ToggleRemoteDeviceState,
  ToggleRemoteDeviceEvent,
  ToggleRemoteDeviceStateMachine,
  InteractionEventPayload,
} from '@/components/ClassRoom/utils/InteractionManager';
import { ISpectatorInfo } from '@/components/ClassRoom/types';
import toast from '@/utils/toast';
import styles from './styles.less';

const InteractingControls: React.FC<ISpectatorInfo> = (
  props: ISpectatorInfo
) => {
  const { interactionManager } = useContext(ClassContext);
  const { isTeacher, userId, userName, userNick } = useContext(ControlsContext);
  const { canKickMember } = useContext(AsideContext);
  const {
    camera: teacherCamera,
    microphone: teacherMicrophone,
    classroomInfo,
    connectedSpectators,
    setConnectedSpectators,
    updateConnectedSpectator,
    setCameraEnable,
    setMicrophoneEnable,
  } = useClassroomStore.getState();
  const { micOpened = true, cameraOpened = true } = props;

  const [micToggleState, setMicToggleState] =
    useState<ToggleRemoteDeviceStateMachine | null>(null);
  const [cameraToggleState, setCameraToggleState] =
    useState<ToggleRemoteDeviceStateMachine | null>(null);

  const switchCamera = useCallback(() => {
    if (cameraToggleState?.state === ToggleRemoteDeviceState.Waiting) return;

    if (isTeacher) {
      setCameraEnable(!teacherCamera.enable);
    } else {
      const controlledCameraOpened = !cameraOpened;
      const stateMachine = (
        interactionManager as TeacherInteractionManager
      )?.ToggleCamera(userId, controlledCameraOpened);
      setCameraToggleState(stateMachine);
    }
  }, [
    isTeacher,
    teacherCamera,
    cameraOpened,
    userId,
    interactionManager,
    cameraToggleState,
  ]);

  useEffect(() => {
    if (cameraToggleState) {
      const reset = (
        payload: InteractionEventPayload<ToggleRemoteDeviceState>
      ) => {
        const { failed = true } = payload;
        if (failed === true) {
          toast.warning(`${cameraOpened ? '开启' : '关闭'}摄像头失败`);
        } else {
          toast(`摄像头已${cameraOpened ? '开启' : '关闭'}`);
        }
        setCameraToggleState(null);
      };
      cameraToggleState.on(ToggleRemoteDeviceEvent.Timeout, reset);
      cameraToggleState.on(ToggleRemoteDeviceEvent.Answered, reset);
      return () => {
        cameraToggleState.off(ToggleRemoteDeviceEvent.Timeout, reset);
        cameraToggleState.off(ToggleRemoteDeviceEvent.Answered, reset);
      };
    }
  }, [cameraToggleState, cameraOpened]);

  const switchMic = useCallback(() => {
    if (micToggleState?.state === ToggleRemoteDeviceState.Waiting) return;

    if (isTeacher) {
      setMicrophoneEnable(!teacherMicrophone.enable);
    } else {
      const controlledMicOpened = !micOpened;
      const stateMachine = (
        interactionManager as TeacherInteractionManager
      )?.ToggleMic(userId, controlledMicOpened);
      setMicToggleState(stateMachine);
    }
  }, [
    isTeacher,
    teacherMicrophone,
    micOpened,
    userId,
    interactionManager,
    micToggleState,
  ]);

  useEffect(() => {
    if (micToggleState) {
      const reset = (
        payload: InteractionEventPayload<ToggleRemoteDeviceState>
      ) => {
        const { failed = true } = payload;
        if (failed === true) {
          toast.warning(`${micOpened ? '开启' : '取消'}静音失败`);
        } else {
          toast(`静音已${micOpened ? '取消' : '开启'}`);
        }
        setMicToggleState(null);
      };
      micToggleState.on(ToggleRemoteDeviceEvent.Timeout, reset);
      micToggleState.on(ToggleRemoteDeviceEvent.Answered, reset);
      return () => {
        micToggleState.off(ToggleRemoteDeviceEvent.Timeout, reset);
        micToggleState.off(ToggleRemoteDeviceEvent.Answered, reset);
      };
    }
  }, [micToggleState, micOpened]);

  // 结束连麦
  const endAllInteraction = useCallback(() => {
    (interactionManager as TeacherInteractionManager)?.endAllInteraction();
    // 只保留老师在连麦成员中
    setConnectedSpectators(
      connectedSpectators.filter(
        ({ userId }) => classroomInfo.teacherId === userId
      )
    );
  }, [userId, connectedSpectators, interactionManager]);

  // 下麦
  const endInteraction = useCallback(() => {
    (interactionManager as TeacherInteractionManager)?.endInteraction(userId);
    updateConnectedSpectator(userId);
  }, [userId, interactionManager]);

  const handleMoreClick: MenuProps['onClick'] = useCallback(
    ({ key }: any) => {
      if (key === 'endAllInteraction') {
        endAllInteraction();
      }
      if (key === 'endInteraction') {
        endInteraction();
      }
    },
    [endAllInteraction, endInteraction]
  );

  const moreActions: any[] = useMemo(() => {
    if (isTeacher) {
      return [
        {
          label: '结束连麦',
          key: 'endAllInteraction',
        },
      ];
    }
    const normalActions = [
      {
        label: '下麦',
        key: 'endInteraction',
      },
    ] as any[];
    if (canKickMember) {
      normalActions.push({
        label: (
          <KickMember userId={userId} userName={userName ?? userNick ?? userId}>
            移除教室
          </KickMember>
        ),
        key: 'kick',
      });
    }
    return normalActions;
  }, [userId, userName, userNick, isTeacher, canKickMember]);

  const renderMic = () => {
    if (micToggleState?.state === ToggleRemoteDeviceState.Waiting)
      return <MicLoadingSvg />;
    const micEnable = isTeacher ? teacherMicrophone.enable : micOpened;
    return micEnable ? <MicNormalSvg /> : <MicCloseSvg />;
  };

  const renderCamera = () => {
    if (cameraToggleState?.state === ToggleRemoteDeviceState.Waiting)
      return <CameraLoadingSvg />;
    const cameraEnable = isTeacher ? teacherCamera.enable : cameraOpened;
    return cameraEnable ? <CameraNormalSvg /> : <CameraCloseSvg />;
  };

  return (
    <div className={styles['member-controls']}>
      <Dropdown
        menu={{
          items: moreActions,
          onClick: handleMoreClick,
        }}
        arrow
        placement="bottomRight"
      >
        <MoreOutlined className={styles['item-controls__more']} />
      </Dropdown>
      <Button
        className={styles['item-controls__btn']}
        size="small"
        type="text"
        onClick={switchCamera}
      >
        {renderCamera()}
      </Button>
      <Button
        className={styles['item-controls__btn']}
        size="small"
        type="text"
        onClick={switchMic}
      >
        {renderMic()}
      </Button>
    </div>
  );
};

export default InteractingControls;
