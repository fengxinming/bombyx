import { EventEmitter } from 'node:events';

export interface EslintOptions {
  /** 检查 typescript */
  ts?: boolean;
  /** 检查 react */
  react?: boolean;
}

export interface Options {
  /** 当前工作目录 */
  cwd?: string;
  /** 配置eslint */
  eslint?: boolean | EslintOptions;
  /** 配置husky */
  husky?: boolean;
  /**  */
  emitter: EventEmitter;
}

