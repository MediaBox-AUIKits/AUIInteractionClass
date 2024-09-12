class GlobalAudioContext {
  protected static instance: AudioContext;

  static getInstance() {
    if (!GlobalAudioContext.instance) {
      GlobalAudioContext.instance = new AudioContext();
    }
    GlobalAudioContext.instance.resume();
    return GlobalAudioContext.instance;
  }
}

export default GlobalAudioContext;
