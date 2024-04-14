import { join } from 'node:path';

import { devDeps, lintstagedConfigFiles } from '../shared/constants';
import Context from '../shared/context';
import { rootPath, writeFileFrom } from '../shared/util';

/**
 * 配置 lint-staged
 */
export default async function doLintStaged(
  ctx: Context,
  next: () => void
): Promise<void> {
  const {
    pkg,
    files,
    cwd
  } = ctx;

  const { dependencies = {}, devDependencies = {} } = pkg as Record<string, any>;
  const lintStagedVersion = dependencies['lint-staged'] || devDependencies['lint-staged'];

  // 未安装 lint-staged
  if (!lintStagedVersion) {
    devDependencies['lint-staged'] = devDeps['lint-staged'];
  }

  const lintStagedConfigFile = files.find((n) => lintstagedConfigFiles.includes(n));
  if (!lintStagedConfigFile) {
    // 读取 lint-staged 配置
    if (pkg['lint-staged']) {
      ctx.fail('在 package.json 中已存在 lint-staged 配置.');
      return next();
    }
  }
  else {
    ctx.fail(`配置文件 ${lintStagedConfigFile} 已存在.`);
    return next();
  }

  writeFileFrom(
    join(cwd, '.lintstagedrc'),
    join(rootPath, 'config/husky/lintstagedrc.json')
  );

  ctx.done('配置 lint-staged 完成.');
  next();
}
