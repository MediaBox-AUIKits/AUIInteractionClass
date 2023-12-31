import React, { useMemo } from 'react';
import useClassroomStore from '../store';
import Player from '../components/Player';
import Icon from '@ant-design/icons';
import { CameraCloseSolidSvg } from '../components/icons';
import { ClassroomStatusEnum, SourceType, ICdnUrlMap } from '../types';

import styles from './H5Player.less';

const TextMapBySourceType: Record<
  SourceType,
  Record<ClassroomStatusEnum, string>
> = {
  [SourceType.Camera]: {
    [ClassroomStatusEnum.started]: '',
    [ClassroomStatusEnum.no_data]: '课程初始化中...',
    [ClassroomStatusEnum.not_start]: '课程尚未开始',
    [ClassroomStatusEnum.ended]: '课程已结束',
  },
  [SourceType.Material]: {
    [ClassroomStatusEnum.started]: '',
    [ClassroomStatusEnum.no_data]: '课程初始化中...',
    [ClassroomStatusEnum.not_start]: '课程尚未开始，请耐心等候',
    [ClassroomStatusEnum.ended]: '课程已结束',
  },
};

interface H5PlayerProps {
  id: string;
  device?: 'mobile' | 'pc';
  rtsFirst?: boolean;
  noSource?: boolean;
  sourceType?: SourceType;
  statusTextVisible?: boolean;
  mute?: boolean;
  cdnUrlMap?: ICdnUrlMap;
  controlBarVisibility?: string;
  onBarVisibleChange?: (bool: boolean) => void;
  onRtsFallback?: () => void;
}

/**
 * 包含课程没有进行中、无画面的 UI
 */
function H5Player(props: H5PlayerProps) {
  const {
    id,
    device = 'mobile',
    statusTextVisible = true,
    sourceType,
    noSource,
    rtsFirst,
    mute,
    cdnUrlMap,
    controlBarVisibility,
    onBarVisibleChange,
    onRtsFallback,
  } = props;

  const { status, vodInfo } = useClassroomStore(state => state.classroomInfo);
  const connectedSpectators = useClassroomStore(
    state => state.connectedSpectators
  );

  const isLiving = useMemo(
    () =>
      status === ClassroomStatusEnum.started && !!connectedSpectators.length,
    [status, connectedSpectators]
  );

  const allowPlayback = useMemo(() => {
    // TODO: 当前版本未支持回看
    // if (
    //   status === ClassroomStatusEnum.ended
    //   && vodInfo
    //   && vodInfo.status === VODStatusEnum.success
    //   && vodInfo.playlist[0]
    //   && vodInfo.playlist[0].playUrl
    // ) {
    //   return true;
    // }
    return false;
  }, [status, vodInfo]);

  const statusText = useMemo(() => {
    return TextMapBySourceType[sourceType ?? SourceType.Material]?.[status];
  }, [status, sourceType]);

  const handlePlayerError = () => {
    if (onBarVisibleChange) onBarVisibleChange(false);
  };

  const noSourceDisplay = (
    <div className={styles['player-non-source-container']}>
      <div className={styles['player-non-source-content']}>
        {sourceType === SourceType.Camera ? (
          <div className={styles['icon-camera-close']}>
            <Icon component={CameraCloseSolidSvg} />
          </div>
        ) : null}
      </div>
    </div>
  );
  const nonLivingDisplay = (
    <div className={styles['player-non-living-container']}>
      <div className={styles['player-non-living-content']}>
        {sourceType === SourceType.Camera ? (
          <div className={styles['icon-camera-close']}>
            <Icon component={CameraCloseSolidSvg} />
          </div>
        ) : null}
        {statusTextVisible ? statusText : null}
      </div>
    </div>
  );

  return (
    <div
      className={device === 'mobile' ? styles.h5player : styles['pc-player']}
    >
      {isLiving || allowPlayback ? (
        noSource ? (
          noSourceDisplay
        ) : (
          <Player
            id={id}
            sourceType={sourceType}
            allowPlayback={allowPlayback}
            rtsFirst={rtsFirst}
            cdnUrlMap={cdnUrlMap}
            vodInfo={vodInfo}
            mute={mute}
            wrapClassName={styles['h5player-container']}
            device={device}
            controlBarVisibility={controlBarVisibility}
            onBarVisibleChange={onBarVisibleChange}
            onError={handlePlayerError}
            onRtsFallback={onRtsFallback}
          />
        )
      ) : (
        nonLivingDisplay
      )}
    </div>
  );
}

export default H5Player;
