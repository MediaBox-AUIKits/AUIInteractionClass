import { useEffect, useMemo, useState, useRef } from 'react';
import Icon from '@ant-design/icons';
import {
  LiveService,
  EnterpriseSkinLayoutLive,
  EnterpriseSkinLayoutPlayback,
} from './live';
import { ResetSvg } from '../icons';
import useClassroomStore from '../../store';
import { ClassroomStatusEnum } from '../../types';
import { replaceHttps, UA } from '../../utils/common';
import './index.less';

interface PlayerProps {
  device: 'mobile' | 'pc';
  wrapClassName: string;
  onReady?: () => void;
  onBarVisibleChange?: (bool: boolean) => void;
  onError?: () => void;
}

export default function Player(props: PlayerProps) {
  const { wrapClassName, onReady, onBarVisibleChange, onError } = props;
  const { status, vodInfo, linkInfo } = useClassroomStore(
    state => state.classroomInfo
  );
  const { cdnPullInfo } = linkInfo || {};
  const [errorDisplayVisible, setErrorDisplayVisible] = useState(true);
  const isLiving = status === ClassroomStatusEnum.started;

  const callbacksRef = useRef({ onReady, onBarVisibleChange, onError }); // 解决闭包问题

  useEffect(() => {
    callbacksRef.current = { onReady, onBarVisibleChange, onError };
  }, [onReady, onBarVisibleChange]);

  const statusText = useMemo(() => {
    const TextMap: any = {
      [ClassroomStatusEnum.no_data]: '课程初始化中...',
      [ClassroomStatusEnum.not_start]: '课程尚未开始，请耐心等候',
      [ClassroomStatusEnum.ended]: '课程已结束',
    };

    return TextMap[status];
  }, [status]);

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

  const liveService = useMemo(() => new LiveService(), []);

  const containerClassNames = useMemo(() => {
    const arr: string[] = [wrapClassName];
    if (errorDisplayVisible) {
      arr.push('prism-ErrorMessage-hidden');
    }
    return arr.join(' ');
  }, [errorDisplayVisible]);

  const listenPlayerEvents = () => {
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
  };

  useEffect(() => {
    const dispose = () => {
      // 销毁实例
      liveService.destroy();
    };

    if (isLiving && cdnPullInfo) {
      // PC 环境优先用 flv，因为延时比 hls 小
      let arr: string[] = [];
      if (UA.isPC) {
        arr = [cdnPullInfo.flvUrl, cdnPullInfo.hlsUrl];
      } else {
        arr = [cdnPullInfo.hlsUrl, cdnPullInfo.flvUrl];
      }

      let rtsFallbackSource = arr[0] || arr[1];
      let source = cdnPullInfo.rtsUrl || rtsFallbackSource;

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

      liveService.play({
        source,
        rtsFallbackSource,
        skinLayout: EnterpriseSkinLayoutLive,
        controlBarVisibility: 'click',
      });

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
  }, [isLiving]);

  const playbackHandler = () => {
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
      source,
      format: vodInfo.playlist[0].format,
      skinLayout: EnterpriseSkinLayoutPlayback,
      controlBarVisibility: 'click',
    });

    listenPlayerEvents();
  };

  return (
    <div className={containerClassNames}>
      <div id="player"></div>
      {!isLiving && (
        <div className="player-nolive">
          <div>{statusText}</div>
          {allowPlayback ? (
            <div className="player-playback" onClick={playbackHandler}>
              <Icon component={ResetSvg} />
              回看
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
