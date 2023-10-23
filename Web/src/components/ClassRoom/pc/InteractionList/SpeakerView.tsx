import React, { useMemo, useRef, useState, useEffect, Fragment } from 'react';
import classNames from 'classnames';
import ResizeObserver from 'resize-observer-polyfill';
import Member from './Member';
import Self from './Self';
import whiteBoardFactory from '../../utils/whiteboard';
import { ISpectatorInfo } from '../../types';
import { LeftOutlineSvg } from '../../components/icons';
import styles from './index.less';

const SpearkerContentID = 'spearkerContent';
const SpearkerListID = 'spearkerList';
const StepDistance = 360; // 每次移动两个卡片的距离

interface ISpeakerViewProps {
  wrapClassName?: string;
  isTeacher?: boolean;
  memberList: ISpectatorInfo[];
  onUserLeft: (userId: string) => void;
}

const SpeakerView: React.FC<ISpeakerViewProps> = props => {
  const { wrapClassName, memberList, isTeacher, onUserLeft } = props;
  // 目前只有老师才需要创建白板实例，因此学生角色无需获取
  const wbIns = useMemo(() => {
    if (!isTeacher) {
      return undefined;
    }
    return whiteBoardFactory.getInstance('netease');
  }, []);
  const contentEl = useRef<HTMLDivElement | null>(null);
  const listEl = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState(200);
  const [listWidth, setListWidth] = useState(0);
  const [movingDistance, setMovingDistance] = useState(0);

  const resizeObserver = useMemo(() => {
    return new ResizeObserver(entries => {
      for (let entry of entries) {
        const cr = entry.contentRect;
        if (entry.target.id === SpearkerContentID) {
          setContentWidth(cr.width);
        } else if (entry.target.id === SpearkerListID) {
          setListWidth(cr.width);
        }
      }
    });
  }, []);

  useEffect(() => {
    // 演讲者视图开启或关闭时，老师端白板容器的尺寸将发生变化，需要手动触发更新，否则笔触位置不对
    wbIns?.updateContainerAfterResize();
    if (contentEl.current) {
      resizeObserver.observe(contentEl.current);
    }
    if (listEl.current) {
      resizeObserver.observe(listEl.current);
    }

    return () => {
      resizeObserver.disconnect();
      wbIns?.updateContainerAfterResize();
    };
  }, []);

  useEffect(() => {
    if (contentWidth > listWidth) {
      setMovingDistance(0);
    } else if (contentWidth + movingDistance > listWidth) {
      setMovingDistance(listWidth - contentWidth);
    }
  }, [contentWidth, listWidth, movingDistance]);

  const overflow = useMemo(
    () => contentWidth < listWidth,
    [contentWidth, listWidth]
  );
  const leftDisabled = useMemo(() => movingDistance <= 0, [movingDistance]);
  const rightDisabled = useMemo(
    () => contentWidth + movingDistance >= listWidth,
    [contentWidth, listWidth, movingDistance]
  );

  const moveToLeft = () => {
    if (leftDisabled) {
      return;
    }
    setMovingDistance(Math.max(movingDistance - StepDistance, 0));
  };

  const moveToRight = () => {
    if (rightDisabled) {
      return;
    }
    let dis = movingDistance + StepDistance;
    if (dis + contentWidth > listWidth) {
      dis = listWidth - contentWidth;
    }
    setMovingDistance(dis);
  };

  return (
    <section
      className={classNames(styles['speaker-view__wrap'], wrapClassName)}
    >
      {overflow ? (
        <Fragment>
          <div
            className={classNames(styles['spearker-view__left'], {
              disabled: leftDisabled,
            })}
            onClick={moveToLeft}
          >
            <LeftOutlineSvg />
          </div>
          <div
            className={classNames(styles['spearker-view__right'], {
              disabled: rightDisabled,
            })}
            onClick={moveToRight}
          >
            <LeftOutlineSvg />
          </div>
        </Fragment>
      ) : null}

      <div
        ref={contentEl}
        id={SpearkerContentID}
        className={classNames(styles['speaker-view__content'], { overflow })}
      >
        <div
          ref={listEl}
          id={SpearkerListID}
          className={styles['spearker-view__card__list']}
          style={{
            transform: `translateX(${-movingDistance}px)`,
          }}
        >
          <Self wrapClassName={styles['speaker-view__card']} />
          {memberList.map(item => (
            <Member
              key={item.userId}
              {...item}
              wrapClassName={styles['speaker-view__card']}
              onUserLeft={onUserLeft}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpeakerView;
