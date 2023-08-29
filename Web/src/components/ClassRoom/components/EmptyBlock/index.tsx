import React from 'react';
import classNames from 'classnames';
import styles from './index.less';

export interface IEmptyBlock {
  text?: string;
  center?: boolean;
  className?: string;
}

const EmptyBlock: React.FC<IEmptyBlock> = props => {
  const { text, center, className } = props;
  return (
    <div
      className={classNames(
        styles['empty-block'],
        {
          [styles.center]: center,
        },
        className
      )}
    >
      {text || '暂无内容'}
    </div>
  );
};

export default EmptyBlock;
