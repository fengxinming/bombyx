import ora, { Ora } from 'ora';

export class Spinner {
  spinner: Ora;
  private _lastMsg: string | null;

  constructor() {
    this.spinner = ora();
    this._lastMsg = null;
  }

  start(msg: string) {
    const { spinner, _lastMsg } = this;
    if (_lastMsg) {
      spinner.stopAndPersist({
        text: msg
      });
    }
    spinner.text = ` ${msg}`;
    this._lastMsg = msg;
    spinner.start();
  }

  stop(persist?: boolean) {
    const { spinner, _lastMsg } = this;
    if (_lastMsg && persist !== false) {
      spinner.stopAndPersist({
        text: _lastMsg
      });
    }
    else {
      spinner.stop();
    }
    this._lastMsg = null;
  }

  fail(text) {
    this.spinner.fail(text || this._lastMsg);
    this._lastMsg = null;
  }

  done(text) {
    this.spinner.succeed(text || this._lastMsg);
    this._lastMsg = null;
  }
}

export const spinner = new Spinner();
