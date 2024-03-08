import React from 'react';
import AUIMessage from '@/BaseKits/AUIMessage';
import { IClassroomServices, IUserInfo, ClassroomFunction } from './types';
import {
  TeacherInteractionManager,
  StudentInteractionManager,
} from './utils/InteractionManager';
import {
  TeacherCooperationManager,
  AssistantCooperationManager,
} from './utils/AdminCooperation';

type ClassContextType = {
  // 用于学生端是否不加载白板组件，若为 true，将通过播放器播放白板流
  // 仅对非公开课模式的学生端生效
  whiteBoardHidden: boolean;
  auiMessage: InstanceType<typeof AUIMessage>;
  services?: IClassroomServices;
  interactionManager?: TeacherInteractionManager | StudentInteractionManager;
  cooperationManager?: TeacherCooperationManager | AssistantCooperationManager;
  userInfo?: IUserInfo;
  exit: () => void;
  switchScreen: () => void;
};

export const ClassContext = React.createContext<ClassContextType>({
  whiteBoardHidden: false,
  auiMessage: new AUIMessage(CONFIG.imServer),
  exit: () => {},
  switchScreen: () => {},
});
