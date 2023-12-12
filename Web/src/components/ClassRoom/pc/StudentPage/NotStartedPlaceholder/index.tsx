/**
 * 未开课时占位提示
 */
import React, { useContext, useMemo } from 'react';
import { PCMainWrapContext } from '../../../components/PCMainWrap';
import useClassroomStore from '../../../store';
import { ClassStatusTips } from '../../../constants';
import styles from './index.less';

const NotStartedPlaceholder: React.FC = () => {
  const { rendererStyle } = useContext(PCMainWrapContext);
  const { status } = useClassroomStore(state => state.classroomInfo);

  const tip = useMemo(() => {
    return ClassStatusTips[status];
  }, [status]);

  return (
    <div
      className={styles['amaui-classroom__main__not-started-placeholder']}
      style={rendererStyle}
    >
      <p
        className={
          styles['amaui-classroom__main__not-started-placeholder__tip']
        }
      >
        {tip}
      </p>
    </div>
  );
};

export default NotStartedPlaceholder;
