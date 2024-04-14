import doEslint from './eslint';
import doHusky from './husky';
import Context from './shared/context';
import { Options } from './typings';

/**
 * 补全项目配置
 */
export function bombyx(opts: Options): Promise<void> {
  const ctx = new Context(opts);
  ctx.use(doEslint);
  ctx.use(doHusky);
  return ctx.run();
}

export * from './typings';
