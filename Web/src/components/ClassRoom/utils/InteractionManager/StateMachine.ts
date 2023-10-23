import {
  InteractionInvitationState,
  InteractionInvitationEvent,
  InteractionInvitationListener,
  InteractionApplicationState,
  InteractionApplicationEvent,
  InteractionApplicationListener,
  StudentEndInteractionState,
  StudentEndInteractionEvent,
  StudentEndInteractionListener,
  ToggleRemoteDeviceState,
  ToggleRemoteDeviceEvent,
  ToggleRemoteDeviceListener,
} from '.';
import EventEmitter from '@/utils/event';

const DEFAULT_RETRY_INTERVAL = 5000;
const DEFAULT_RETRY_LIMIT = 11;

class StateMachine<
  S extends
    | InteractionInvitationState
    | InteractionApplicationState
    | StudentEndInteractionState
    | ToggleRemoteDeviceState,
  E extends
    | InteractionInvitationListener
    | InteractionApplicationListener
    | StudentEndInteractionListener
    | ToggleRemoteDeviceListener
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

  transition(
    event:
      | InteractionInvitationEvent
      | InteractionApplicationEvent
      | StudentEndInteractionEvent
      | ToggleRemoteDeviceEvent
  ) {}
}

class InteractionInvitationStateMachine extends StateMachine<
  InteractionInvitationState,
  InteractionInvitationListener
> {
  onSendInvitation(retry = false) {
    this.setState(
      retry
        ? InteractionInvitationState.RetryInviting
        : InteractionInvitationState.Inviting
    );
    this.emit(InteractionInvitationEvent.SendInvitation, {
      state: this.currentState,
    });

    if (!retry || this.retryCount <= this.retryLimit) {
      this.retryTimer = window.setTimeout(() => {
        if (this.is(InteractionInvitationState.Initial)) {
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
    this.transition(InteractionInvitationEvent.Retry);
    this.emit(InteractionInvitationEvent.Retry, {
      state: this.currentState,
    });
  }

  onCancel() {
    this.emit(InteractionInvitationEvent.Cancel, {
      state: this.currentState,
    });
    this.resetState();
  }

  onAccepted() {
    this.currentState = InteractionInvitationState.Accepted;
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
    this.emit(InteractionInvitationEvent.Accepted, {
      state: this.currentState,
    });
  }

  onRejected(payload: any) {
    this.emit(InteractionInvitationEvent.Rejected, {
      state: this.currentState,
      reason: payload.reason,
    });
    this.resetState();
  }

  onTimeout() {
    this.emit(InteractionInvitationEvent.Timeout, {
      state: this.currentState,
    });
    this.resetState();
  }

  transition(event: InteractionInvitationEvent, payload?: any) {
    switch (event) {
      case InteractionInvitationEvent.SendInvitation:
        if (!this.is(InteractionInvitationState.Initial))
          throw new Error(
            `current state(${this.currentState}) cannot invoke invite`
          );
        this.onSendInvitation(false);
        return;
      case InteractionInvitationEvent.Retry:
        if (
          !this.is(InteractionInvitationState.Inviting) &&
          !this.is(InteractionInvitationState.RetryInviting)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke retryInvite`
          );
        this.onSendInvitation(true);
        return;
      case InteractionInvitationEvent.Cancel:
        if (
          !this.is(InteractionInvitationState.Inviting) &&
          !this.is(InteractionInvitationState.RetryInviting)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke cancel`
          );
        this.onCancel();
        return;
      case InteractionInvitationEvent.Accepted:
        if (
          !this.is(InteractionInvitationState.Inviting) &&
          !this.is(InteractionInvitationState.RetryInviting)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke accepted`
          );
        this.onAccepted();
        return;
      case InteractionInvitationEvent.Rejected:
        if (
          !this.is(InteractionInvitationState.Inviting) &&
          !this.is(InteractionInvitationState.RetryInviting)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke rejected`
          );
        this.onRejected(payload);
        return;
    }
  }
}

class InteractionApplicationStateMachine extends StateMachine<
  InteractionApplicationState,
  InteractionApplicationListener
> {
  onSubmitApplication(retry = false) {
    this.setState(
      retry
        ? InteractionApplicationState.RetryApplying
        : InteractionApplicationState.Applying
    );
    this.emit(InteractionApplicationEvent.SubmitApplication, {
      state: this.currentState,
    });

    if (!retry || this.retryCount <= this.retryLimit) {
      this.retryTimer = window.setTimeout(() => {
        if (this.is(InteractionApplicationState.Initial)) {
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
    this.transition(InteractionApplicationEvent.Retry);
    this.emit(InteractionApplicationEvent.Retry, {
      state: this.currentState,
    });
  }

  onAccepted() {
    this.currentState = InteractionApplicationState.Accepted;
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
    this.emit(InteractionApplicationEvent.Accepted, {
      state: this.currentState,
    });
  }

  onRejected() {
    this.emit(InteractionApplicationEvent.Rejected, {
      state: this.currentState,
    });
    this.resetState();
  }

  onCancel() {
    this.emit(InteractionApplicationEvent.Cancel, {
      state: this.currentState,
    });
    this.resetState();
  }

  onTimeout() {
    this.emit(InteractionApplicationEvent.Timeout, {
      state: this.currentState,
    });
    this.resetState();
  }

  transition(event: InteractionApplicationEvent) {
    switch (event) {
      case InteractionApplicationEvent.SubmitApplication:
        if (!this.is(InteractionApplicationState.Initial))
          throw new Error(
            `current state(${this.currentState}) cannot invoke invite`
          );
        this.onSubmitApplication(false);
        return;
      case InteractionApplicationEvent.Retry:
        if (
          !this.is(InteractionApplicationState.Applying) &&
          !this.is(InteractionApplicationState.RetryApplying)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke retryApply`
          );
        this.onSubmitApplication(true);
        return;
      case InteractionApplicationEvent.Accepted:
        if (
          !this.is(InteractionApplicationState.Applying) &&
          !this.is(InteractionApplicationState.RetryApplying)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke accepted`
          );
        this.onAccepted();
        return;
      case InteractionApplicationEvent.Cancel:
        if (
          !this.is(InteractionApplicationState.Applying) &&
          !this.is(InteractionApplicationState.RetryApplying)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke cancel`
          );
        this.onCancel();
        return;
      case InteractionApplicationEvent.Rejected:
        if (
          !this.is(InteractionApplicationState.Applying) &&
          !this.is(InteractionApplicationState.RetryApplying)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke rejected`
          );
        this.onRejected();
        return;
    }
  }
}

class StudentEndInteractionStateMachine extends StateMachine<
  StudentEndInteractionState,
  StudentEndInteractionListener
> {
  onNotice(retry = false) {
    this.setState(
      retry
        ? StudentEndInteractionState.RetryNoticing
        : StudentEndInteractionState.Noticing
    );
    this.emit(StudentEndInteractionEvent.Notice, {
      state: this.currentState,
    });

    if (!retry || this.retryCount <= this.retryLimit) {
      this.retryTimer = window.setTimeout(() => {
        if (this.is(StudentEndInteractionState.Initial)) {
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
    this.transition(StudentEndInteractionEvent.Retry);
    this.emit(StudentEndInteractionEvent.Retry, {
      state: this.currentState,
    });
  }

  onAllowed() {
    this.currentState = StudentEndInteractionState.Allowed;
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
    this.emit(StudentEndInteractionEvent.Allowed, {
      state: this.currentState,
    });
  }

  onTimeout() {
    this.emit(StudentEndInteractionEvent.Timeout, {
      state: this.currentState,
    });
    this.resetState();
  }

  transition(event: StudentEndInteractionEvent) {
    switch (event) {
      case StudentEndInteractionEvent.Notice:
        if (!this.is(StudentEndInteractionState.Initial))
          throw new Error(
            `current state(${this.currentState}) cannot invoke notice`
          );
        this.onNotice(false);
        return;
      case StudentEndInteractionEvent.Retry:
        if (
          !this.is(StudentEndInteractionState.Noticing) &&
          !this.is(StudentEndInteractionState.RetryNoticing)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke retryNotice`
          );
        this.onNotice(true);
        return;
      case StudentEndInteractionEvent.Allowed:
        if (
          !this.is(StudentEndInteractionState.Noticing) &&
          !this.is(StudentEndInteractionState.RetryNoticing)
        )
          throw new Error(
            `current state(${this.currentState}) cannot invoke allowed`
          );
        this.onAllowed();
        return;
    }
  }
}

class ToggleRemoteDeviceStateMachine extends StateMachine<
  ToggleRemoteDeviceState,
  ToggleRemoteDeviceListener
> {
  onNotice(retry = false) {
    this.setState(ToggleRemoteDeviceState.Waiting);
    this.emit(ToggleRemoteDeviceEvent.Notice, {
      state: this.currentState,
    });

    if (!retry || this.retryCount <= this.retryLimit) {
      this.retryTimer = window.setTimeout(() => {
        if (this.is(ToggleRemoteDeviceState.Initial)) {
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
    this.transition(ToggleRemoteDeviceEvent.Retry);
    this.emit(ToggleRemoteDeviceEvent.Retry, {
      state: this.currentState,
    });
  }

  onAnswered(failed = false) {
    this.currentState = ToggleRemoteDeviceState.Answered;
    this.retryCount = 0;
    clearTimeout(this.retryTimer);
    this.emit(ToggleRemoteDeviceEvent.Answered, {
      state: this.currentState,
      failed,
    });
  }

  onTimeout() {
    this.emit(ToggleRemoteDeviceEvent.Timeout, {
      state: this.currentState,
    });
    this.resetState();
  }

  transition(event: ToggleRemoteDeviceEvent, payload?: any) {
    switch (event) {
      case ToggleRemoteDeviceEvent.Notice:
        if (!this.is(ToggleRemoteDeviceState.Initial))
          throw new Error(
            `current state(${this.currentState}) cannot invoke notice`
          );
        this.onNotice(false);
        return;
      case ToggleRemoteDeviceEvent.Retry:
        if (!this.is(ToggleRemoteDeviceState.Waiting))
          throw new Error(
            `current state(${this.currentState}) cannot invoke retryNotice`
          );
        this.onNotice(true);
        return;
      case ToggleRemoteDeviceEvent.Answered:
        if (!this.is(ToggleRemoteDeviceState.Waiting))
          throw new Error(
            `current state(${this.currentState}) cannot invoke answered`
          );
        this.onAnswered(payload);
        return;
    }
  }
}

export {
  StateMachine,
  InteractionInvitationStateMachine,
  InteractionApplicationStateMachine,
  StudentEndInteractionStateMachine,
  ToggleRemoteDeviceStateMachine,
};
