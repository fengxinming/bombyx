import {
  existsSync,
  readdirSync
} from 'node:fs';
import { dirname, join } from 'node:path';

import { runQueue } from 'celia';

import { Options } from '../typings';
import { readJsonFile, updateFile } from './util';


export default class Context {
  cwd: string;
  files: string[];
  pkg: Record<string, string>;
  pkgPath: string;
  opts: Options;
  queue: Array<(ctx: Context, next: () => void) => void>;

  constructor(opts: Options) {
    this.cwd = opts.cwd || process.cwd();
    this.files = readdirSync(this.cwd);
    this.pkgPath = join(this.cwd, 'package.json');
    this.pkg = readJsonFile(this.pkgPath);
    this.opts = opts;
    this.queue = [];

    if (!existsSync(this.pkgPath)) {
      updateFile(this.pkgPath, {
        name: dirname(this.cwd),
        version: '1.0.0'
      });
    }
  }

  use(fn: (ctx: Context, next: () => void) => void): void {
    this.queue.push(fn);
  }

  done(msg: string): void {
    this.opts.emitter.emit('log', 'done', msg);
  }

  fail(msg: string): void {
    this.opts.emitter.emit('log', 'fail', msg);
  }

  run(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        runQueue(this.queue, (fn, next) => {
          fn(this, next);
        }, resolve);
      }
      catch (err) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(err as Error);
      }
    });
  }
}
