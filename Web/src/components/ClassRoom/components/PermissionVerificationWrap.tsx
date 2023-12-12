import React, { JSXElementConstructor, ReactElement, useContext } from 'react';
import { ClassroomFunction } from '../types';
import useClassroomStore from '@/components/ClassRoom/store';
import { HasNoPermission } from '@/components/ClassRoom/constants';

interface IProps {
  noPermissionNotify?: string;
  hideIfNoPermission?: boolean;
  functionKey?: ClassroomFunction;
  children: React.ReactNode;
  functionsVerificationMap?: Record<string, ClassroomFunction>;
}

const PermissionVerificationWrap: React.FC<IProps> = props => {
  const {
    noPermissionNotify = HasNoPermission,
    hideIfNoPermission = true,
    children,
    functionKey,
    functionsVerificationMap = {},
  } = props;
  const accessibleFunctions = useClassroomStore(
    state => state.accessibleFunctions
  );
  const hasPermission =
    functionKey !== undefined && accessibleFunctions.includes(functionKey);

  if (hasPermission) return children;
  if (functionKey && hideIfNoPermission) return null;

  const childrenWithProps = React.Children.map(children, child => {
    const childProps: Record<string, any> = {
      noPermission: !hasPermission,
      noPermissionNotify,
    };
    Object.entries(functionsVerificationMap).forEach(entry => {
      const [propKey, funcKey] = entry;
      childProps[propKey] = accessibleFunctions.includes(funcKey);
    });
    return React.cloneElement(
      child as ReactElement<any, string | JSXElementConstructor<any>>,
      childProps
    );
  });

  return childrenWithProps;
};

export default PermissionVerificationWrap;
