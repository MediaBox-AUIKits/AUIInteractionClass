import React from 'react';
import NeteaseBoard from './NeteaseBoard';

interface IProps {
  wrapClassName?: string;
  serverType?: 'netease';
}

const WhiteBoard: React.FC<IProps> = props => {
  const { wrapClassName, serverType = 'netease' } = props;

  if (serverType === 'netease') {
    return <NeteaseBoard wrapClassName={wrapClassName} />;
  }

  return null;
};

export default WhiteBoard;
