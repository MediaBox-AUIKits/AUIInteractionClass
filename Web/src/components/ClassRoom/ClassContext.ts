import React from 'react';
import AUIMessage from '@/BaseKits/AUIMessage';
import { IClassroomServices, IUserInfo } from './types';
import {
  TeacherInteractionManager,
  StudentInteractionManager,
} from './utils/InteractionManager';

type ClassContextType = {
  auiMessage: InstanceType<typeof AUIMessage>;
  services?: IClassroomServices;
  interactionManager?: TeacherInteractionManager | StudentInteractionManager;
  userInfo?: IUserInfo;
  exit: () => void;
};

export const ClassContext = React.createContext<ClassContextType>({
  auiMessage: new AUIMessage(CONFIG.imServer),
  exit: () => {},
});
