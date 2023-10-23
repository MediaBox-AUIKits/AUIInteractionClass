import React from 'react';
import classNames from 'classnames';
import styles from './index.less';

export interface IAsideTabItem {
  label: string;
  key: string;
  labelTag?: React.ReactNode;
  children: React.ReactNode;
}

interface IAsideTabsProps {
  activeKey: string;
  items: IAsideTabItem[];
  onChange: (key: string) => void;
}

const AsideTabs: React.FC<IAsideTabsProps> = props => {
  const { activeKey, items, onChange } = props;

  const handleClick = (key: string) => {
    if (key !== activeKey) {
      onChange(key);
    }
  };

  return (
    <div className={styles['aside__tabs']}>
      <div className={styles['aside__tabs__nav']}>
        {items.map(item => (
          <span
            key={item.key}
            className={classNames(styles['aside__tabs__nav__item'], {
              active: activeKey === item.key,
              normal: items.length <= 1,
            })}
            onClick={() => handleClick(item.key)}
          >
            {item.label}
            {item.labelTag}
          </span>
        ))}
      </div>

      {items.map(item => (
        <div
          key={item.key}
          className={styles['aside__tabs__content']}
          style={activeKey === item.key ? undefined : { display: 'none' }}
        >
          {item.children}
        </div>
      ))}
    </div>
  );
};

export default AsideTabs;
