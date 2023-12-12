import React from 'react';
import { Permission } from '@/types';

export interface ILoginServices {
  fetchAssistantPermissions?: (
    classId: string,
    userName: string
  ) => Promise<Permission[] | undefined>;
  setAssistantPermissions?: (
    classId: string,
    permissions: Permission[]
  ) => void;
  deleteAssistantPermissions?: (classId: string) => void;
}

export interface LoginProps {
  onLoginSuccess: (id: any, role?: any) => void;
  services?: ILoginServices;
}

export interface AssistantPermissionItem {
  label: string;
  icon: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
    }
  >;
  key: Permission;
}

export interface AssistantPermissionGroup {
  title: string;
  options: AssistantPermissionItem[];
}
