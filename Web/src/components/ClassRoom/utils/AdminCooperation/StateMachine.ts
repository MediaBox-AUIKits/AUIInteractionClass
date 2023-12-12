import {
  MuteGroupOrUserState,
  MuteGroupOrUserEvent,
  MuteGroupOrUserListener,
} from '.';
import EventEmitter from '@/utils/event';

const DEFAULT_RETRY_INTERVAL = 5000;
const DEFAULT_RETRY_LIMIT = 11;

class StateMachine<
  S extends MuteGroupOrUserState,
  E extends MuteGroupOrUserListener
> extends EventEmitter<E> {
  initState: S;
  currentState: S;
  retryCount = 0;
  retryInterval = DEFAULT_RETRY_INTERVAL;
  retryLimit = DEFAULT_RETRY_LIMIT;
  transitions: any[] = [];
  protected retryTimer: number = 0;

  constructor(
    initialState: S,
    retryInterval = DEFAULT_RETRY_INTERVAL,
    retryLimit = DEFAULT_RETRY_LIMIT
  ) {
    super();
    this.initState = initialState;
    this.currentState = initialState;
    this.retryInterval = retryInterval;
    this.retryLimit = retryLimit;
  }

  get state() {
    return this.currentState;
  }

  is(state: S) {
    return this.currentState === state;
  }

  protected setState(state: S) {
    this.currentState = state;
  }

  protected resetState() {
    this.setState(this.initState);
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
    console.log('[FSM] Reset');
  }

  transition(event: MuteGroupOrUserEvent) {}
}

class AssistantMuteGroupOrUserStateMachine extends StateMachine<
  MuteGroupOrUserState,
  MuteGroupOrUserListener
> {
  onRequest(retry = false) {
    this.setState(
      retry
        ? MuteGroupOrUserState.RetryRequesting
        : MuteGroupOrUserState.Requesting
    );
    this.emit(MuteGroupOrUserEvent.Request, {
      state: this.currentState,
    });

    if (!retry || this.retryCount <= this.retryLimit) {
      this.retryTimer = window.setTimeout(() => {
        if (this.is(MuteGroupOrUserState.Initial)) {
          return;
        }
        if (this.retryCount < this.retryLimit) {
          this.onRetry();
        } else {
          this.onTimeout();
        }
      }, this.retryInterval);
    }
  }

  onRetry() {
    this.retryCount += 1;
    this.transition(MuteGroupOrUserEvent.Retry);
    this.emit(MuteGroupOrUserEvent.Retry, {
      state: this.currentState,
    });
  }

  onResponsed(payload?: Record<string, any>) {
    this.currentState = MuteGroupOrUserState.Responsed;
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
    this.emit(MuteGroupOrUserEvent.Responsed, {
      state: this.currentState,
      ...payload,
    });
  }

  onTimeout() {
    this.emit(MuteGroupOrUserEvent.Timeout, {
      state: this.currentState,
    });
    this.resetState();
  }

  transition(event: MuteGroupOrUserEvent, payload?: Record<string, any>) {
    switch (event) {
      case MuteGroupOrUserEvent.Request:
        if (!this.is(MuteGroupOrUserState.Initial))
          throw new Error(
            `current state(${this.currentState}) cannot invoke invite`
          );
        this.onRequest(false);
        return;
      case MuteGroupOrUserEvent.Retry:
        if (
          !this.is(MuteGroupOrUserState.Requesting) &&
          !this.is(MuteGroupOrUserState.RetryRequesting)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke retryInvite`
          );
        this.onRequest(true);
        return;
      case MuteGroupOrUserEvent.Responsed:
        if (
          !this.is(MuteGroupOrUserState.Requesting) &&
          !this.is(MuteGroupOrUserState.RetryRequesting)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke accepted`
          );
        this.onResponsed(payload);
        return;
    }
  }
}

export { StateMachine, AssistantMuteGroupOrUserStateMachine };
