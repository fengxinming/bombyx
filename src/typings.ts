import { EventEmitter } from 'node:events';

export interface EslintOptions {
  /** 适配 typescript 相关 */
  ts?: boolean;
  /** 适配 react 相关 */
  react?: boolean;
}

export interface HuskyOptions {
  /** 添加 lint-staged 支持 */
  lintStaged: boolean;
  /** 添加 commitlint 支持 */
  commitLint: boolean;
}

export interface Options {
  /** 当前工作目录 */
  cwd?: string;
  /** 配置eslint */
  eslint?: boolean | EslintOptions;
  /** 配置husky */
  husky?: boolean | HuskyOptions;
  /** 自定义事件触发 */
  emitter: EventEmitter;
  /** 指定语言显示 */
  lang?: string;
}

export interface UserSelection {
  functions: string[];
  eslintExtra: string[];
}
