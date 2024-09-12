import EventEmitter from '@/utils/event';
import GlobalAudioContext from '../../../components/ClassRoom/utils/globalAudioContext';
import { VOICE_ACTIVE_THRESHOLD } from './constants';

export interface IAnalyseLevelResult {
  updateInterval: (time: number) => void;
  getLevel: () => number;
  dispose: () => void;
}

export function analyseLevel(
  audioContext: AudioContext,
  beforeNode: AudioNode,
  afterNode: AudioNode,
  interval: number,
  onAnalyse?: (level: number) => void,
): IAnalyseLevelResult {
  let intervalMs = interval;
  let cache: number = 0; // 缓存数据
  let timer: number;
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  const pcmData = new Uint8Array(analyserNode.frequencyBinCount);
  // cloudfare 开源方式
  // analyserNode.fftSize = 32;
  // const pcmData2 = new Float32Array(analyserNode.fftSize);

  beforeNode.connect(analyserNode);
  analyserNode.connect(afterNode);

  const stopTick = () => {
    if (timer) {
      window.clearInterval(timer);
    }
  };

  const startTick = () => {
    // TODO: 若需要在页面 hidden 等情况下仍正常按定时执行，需要使用 TimerWorker 方案
    timer = window.setInterval(() => {
      analyserNode.getByteFrequencyData(pcmData);
      let current = Math.round(
        pcmData.reduce((acc, cur) => acc + cur) / pcmData.length,
      );
      current = Math.min(100, current);
      // cloudfare 开源方式
      // analyserNode.getFloatTimeDomainData(pcmData2);
      // let sumSquares = 0.0;
      // for (const amplitude of pcmData2) {
      //   sumSquares += amplitude * amplitude;
      // }
      // const current = Math.sqrt(sumSquares / pcmData.length);
      // 通过回调返回
      cache = current;
      onAnalyse && onAnalyse(current);
    }, intervalMs);
  };

  startTick();

  return {
    updateInterval: (time: number) => {
      stopTick();
      intervalMs = time;
      startTick();
    },
    getLevel: () => {
      return cache;
    },
    dispose: () => {
      stopTick();
      beforeNode.disconnect();
      analyserNode.disconnect();
    },
  };
}

interface AudioLevelMonitorListener {
  audioLevel: (level: number) => void;
}

class AudioLevelMonitor extends EventEmitter<AudioLevelMonitorListener> {
  private audioContext: AudioContext;
  private stream: MediaStream;
  private sourceNode?: MediaStreamAudioSourceNode;
  private analyser?: IAnalyseLevelResult;

  constructor() {
    super();
    this.audioContext = GlobalAudioContext.getInstance();
    this.stream = new MediaStream();
  }

  getLevel(): number {
    if (this.analyser) {
      return this.analyser.getLevel();
    }
    return 0;
  }

  /**
   * 开启监听 audio level 的变化
   *
   * @param {MediaStreamTrack} track 音频轨
   * @param {number} [interval=1000] 检测间隔，单位毫秒，默认 1000ms
   */
  start(track: MediaStreamTrack, interval: number = 1000) {
    if (this.sourceNode) {
      this.stop();
    }
    this.stream.addTrack(track);
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    const audioDestination = this.audioContext.createMediaStreamDestination();

    this.analyser = analyseLevel(
      this.audioContext,
      this.sourceNode,
      audioDestination,
      interval,
      (level: number) => {
        // 大于某个音量才算活跃
        if (level > VOICE_ACTIVE_THRESHOLD) {
          this.emit('audioLevel', level);
        }
      },
    );
  }

  stop() {
    if (this.analyser) {
      this.analyser.dispose();
    }
    this.analyser = undefined;
    this.sourceNode = undefined;
    this.stream.getAudioTracks().forEach(item => {
      this.stream.removeTrack(item);
    });
  }

  dispose() {
    this.stop();
  }
}

export default AudioLevelMonitor;
