export type ICallback = (...args: any[]) => any;

interface IListenerMap {
  [s: string]: any;
}

type MapToList<T, V extends keyof T> = { [K in V]: T[K][] };

export default class EventEmitter<T extends IListenerMap> {
  _eventMap = {} as MapToList<T, keyof T>;

  listeners<K extends keyof T>(type: K) {
    return this._eventMap[type] || [];
  }

  emit<K extends keyof T>(type: K, ...args: any[]) {
    const cbs = this._eventMap[type];
    if (Array.isArray(cbs)) {
      cbs.forEach((fn: ICallback) => fn.apply(this, args));
      return true;
    } else {
      return false;
    }
  }

  off<K extends keyof T>(type: K, fn: T[K]) {
    const cbs = this._eventMap[type];
    if (Array.isArray(cbs)) {
      this._eventMap[type] = cbs.filter(v => v !== fn);
    }
    return this;
  }

  removeAllListeners<K extends keyof T>(type?: K) {
    if (type === undefined) {
      this._eventMap = {} as any;
    } else if (this._eventMap[type]) {
      this._eventMap[type] = [];
    }
    return this;
  }

  on<K extends keyof T>(type: K, fn: T[K]) {
    if (this._eventMap[type]) {
      this._eventMap[type].push(fn);
    } else {
      this._eventMap[type] = [fn];
    }
    return this;
  }

  once<K extends keyof T>(type: K, fn: T[K]) {
    const callback = (...args: any[]) => {
      this.off(type, callback as T[K]);
      fn.apply(this, args);
    };
    this.on(type, callback as T[K]);
    return this;
  }
}
