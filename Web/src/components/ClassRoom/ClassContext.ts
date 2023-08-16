import React from 'react';
import AUIMessage from '@/BaseKits/AUIMessage';
import { IClassroomServices, IUserInfo } from './types';

type ClassContextType = {
  auiMessage: InstanceType<typeof AUIMessage>;
  services?: IClassroomServices;
  userInfo?: IUserInfo;
  exit: () => void;
};

export const ClassContext = React.createContext<ClassContextType>({
  auiMessage: new AUIMessage([{
    type: 'interaction'
  }]),
  exit: () => { },
});
