import { useEffect } from 'react';
import { Outlet } from 'umi';
import styles from './index.less';

export default function Layout() {
  useEffect(() => {
    const updateBodyFontSize = () => {
      const width = document.documentElement.clientWidth;
      let value = Math.floor(width / 15);
      value = Math.floor(value / 5) * 5 + 25;
      value = Math.min(value, 75);
      document.documentElement.style.fontSize = `${value}px`;
    };

    updateBodyFontSize();

    window.onresize = () => {
      updateBodyFontSize();
    };

    return () => {
      document.documentElement.style.fontSize = '16px';
    };
  }, []);

  return (
    <div className={styles['app-layout']}>
      <Outlet />
    </div>
  );
}
