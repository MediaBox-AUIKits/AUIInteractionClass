import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Icon from '@ant-design/icons';
import {
  LiveService,
  EnterpriseSkinLayoutLive,
  EnterpriseSkinLayoutPlayback,
} from './live';
import { PlayerParams } from './player';
import { ResetSvg } from '../icons';
import { IVODInfo, ILinkUrlInfo, SourceType } from '../../types';
import { replaceHttps, UA } from '../../utils/common';

import './index.less';

interface PlayerProps {
  id: string;
  device: 'mobile' | 'pc';
  sourceType?: SourceType;
  rtsFirst?: boolean;
  liveInfo?: ILinkUrlInfo;
  allowPlayback?: boolean;
  vodInfo?: IVODInfo;
  mute?: boolean;
  wrapClassName: string;
  controlBarVisibility?: string;
  onReady?: () => void;
  onBarVisibleChange?: (bool: boolean) => void;
  onError?: () => void;
  onRtsFallback?: () => void;
}

export default function Player(props: PlayerProps) {
  const {
    id = 'default',
    sourceType = SourceType.Camera,
    rtsFirst = true,
    liveInfo,
    allowPlayback = false,
    vodInfo,
    mute = false,
    wrapClassName,
    controlBarVisibility,
    onReady,
    onBarVisibleChange,
    onError,
    onRtsFallback,
  } = props;
  const playerContainerId = useMemo(() => `player_${id}`, [id]);
  const [errorDisplayVisible, setErrorDisplayVisible] = useState(true);

  const callbacksRef = useRef({
    onReady,
    onBarVisibleChange,
    onError,
    onRtsFallback,
  }); // 解决闭包问题

  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onBarVisibleChange,
      onError,
      onRtsFallback,
    };
  }, [onReady, onBarVisibleChange, onError, onRtsFallback]);

  const liveService = useMemo(() => new LiveService(), []);

  const containerClassNames = useMemo(() => {
    const arr: string[] = [wrapClassName];
    if (errorDisplayVisible) {
      arr.push('prism-ErrorMessage-hidden');
    }
    return arr.join(' ');
  }, [errorDisplayVisible]);

  const listenPlayerEvents = useCallback(() => {
    liveService.on('ready', () => {
      callbacksRef.current.onReady && callbacksRef.current.onReady();
    });

    liveService.on('pause', () => {
      // ios 中退出全屏会自动暂停，但这时不会出现居中的播放 ICON，所以主动调一次暂停，触发展示
      liveService.pause();
    });

    liveService.on('error', () => {
      callbacksRef.current.onError && callbacksRef.current.onError();
    });

    liveService.on('hideBar', () => {
      callbacksRef.current.onBarVisibleChange &&
        callbacksRef.current.onBarVisibleChange(false);
    });

    liveService.on('showBar', () => {
      callbacksRef.current.onBarVisibleChange &&
        callbacksRef.current.onBarVisibleChange(true);
    });

    if (rtsFirst) {
      liveService.on('rtsFallback', () => {
        callbacksRef.current.onRtsFallback &&
          callbacksRef.current.onRtsFallback();
      });
    }
  }, [rtsFirst]);

  useEffect(() => {
    const instanceId = +new Date();
    const dispose = () => {
      // 销毁实例
      liveService.destroy(instanceId);
    };

    const { cdnPullInfo } = liveInfo ?? {};
    if (cdnPullInfo) {
      let arr: string[] = [];
      const flvKey =
        sourceType === SourceType.Material ? 'flvScreenUrl' : 'flvUrl';
      const hlsKey =
        sourceType === SourceType.Material ? 'hlsScreenUrl' : 'hlsUrl';
      const rtsKey =
        sourceType === SourceType.Material ? 'rtsScreenUrl' : 'rtsUrl';
      // PC 环境优先用 flv，因为延时比 hls 小
      if (UA.isPC) {
        arr = [cdnPullInfo[flvKey], cdnPullInfo[hlsKey]];
      } else {
        arr = [cdnPullInfo[hlsKey], cdnPullInfo[flvKey]];
      }

      let rtsFallbackSource = arr[0] || arr[1];
      let source = rtsFirst
        ? cdnPullInfo[rtsKey] || rtsFallbackSource
        : rtsFallbackSource;

      // 因为 夸克、UC 有点问题，无法正常播放 rts，所以降级
      if (UA.isQuark || UA.isUC) {
        source = rtsFallbackSource;
      }
      if (
        window.location.protocol === 'https:' &&
        new URL(rtsFallbackSource).protocol === 'http:'
      ) {
        rtsFallbackSource = replaceHttps(rtsFallbackSource) || '';
        source = replaceHttps(source) || '';
      }

      const playConfig: Partial<PlayerParams> = {
        source,
        rtsFallbackSource,
        skinLayout: EnterpriseSkinLayoutLive,
        controlBarVisibility: controlBarVisibility ?? 'click',
        onRtsFallback,
      };

      liveService.play(
        {
          id: playerContainerId,
          ...playConfig,
        },
        instanceId
      );
      if (mute) liveService.mute();

      listenPlayerEvents();

      // 若未开播就进去直播间，等到开播后如果加载 hls 流，很大可能流内容未准备好，就会加载失败
      // 虽然live.ts中有自动重新加载的逻辑，但不想这时展示错误提示
      // 所以先通过 css 隐藏，10 秒后若还是有错误提示就展示
      setTimeout(() => {
        setErrorDisplayVisible(false);
      }, 10000);
    } else {
      dispose();
    }

    return dispose;
  }, [
    mute,
    rtsFirst,
    playerContainerId,
    controlBarVisibility,
    liveInfo,
    sourceType,
    listenPlayerEvents,
  ]);

  const playbackHandler = useCallback(() => {
    if (!vodInfo) {
      return;
    }

    // 当前例子直播回看使用第一个播放地址，可根据您业务调整
    let source = vodInfo.playlist[0].playUrl;
    if (
      window.location.protocol === 'https:' &&
      new URL(source).protocol === 'http:'
    ) {
      source = replaceHttps(source);
    }

    liveService.playback({
      id: playerContainerId,
      source,
      format: vodInfo.playlist[0].format,
      skinLayout: EnterpriseSkinLayoutPlayback,
      controlBarVisibility: 'click',
    });
    if (mute) liveService.mute();

    listenPlayerEvents();
  }, [mute, vodInfo, playerContainerId]);

  return (
    <div className={containerClassNames}>
      <div id={playerContainerId}></div>
      {allowPlayback ? (
        <div className="player-playback" onClick={playbackHandler}>
          <Icon component={ResetSvg} />
          回看
        </div>
      ) : null}
    </div>
  );
}
