import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import doEslint from './functions/eslint';
import doHusky from './functions/husky';
import Context from './shared/context';
import { updateFile } from './shared/util';
import { Options } from './typings';

/**
 * 补全项目配置
 */
export function bombyx(opts: Options): Promise<void> {
  let cwd = opts.cwd;
  if (cwd) {
    if (!isAbsolute(cwd)) {
      cwd = join(process.cwd(), cwd);
    }
    if (!existsSync(cwd)) {
      throw new Error(`${opts.cwd} 目录不存在.`);
    }
    if (!statSync(cwd).isDirectory()) {
      throw new Error(`${opts.cwd} 不是目录.`);
    }
    opts.cwd = cwd;
  }
  else {
    opts.cwd = process.cwd();
  }

  const ctx = new Context(opts);
  ctx.use(doEslint);
  ctx.use(doHusky);
  return ctx.run().then(() => {
    updateFile(ctx.pkgPath, ctx.pkg);
  });
}

export * from './typings';
