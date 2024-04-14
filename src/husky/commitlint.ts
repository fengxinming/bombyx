import { join } from 'node:path';

import { devDeps } from '../shared/constants';
import Context from '../shared/context';
import { rootPath, writeFileFrom } from '../shared/util';

/**
 * 配置 commitlint
 */
export default async function doCommitlint(
  ctx: Context,
  next: () => void
): Promise<void> {
  const {
    pkg,
    files,
    cwd
  } = ctx;

  const { dependencies = {}, devDependencies = {} } = pkg as Record<string, any>;
  const cliVersion
    = dependencies['@commitlint/cli'] || devDependencies['@commitlint/cli'];

  const pkgs: string[] = [];
  // 未安装 @commitlint/cli
  if (!cliVersion) {
    pkgs.push('@commitlint/cli');
  }

  // 不存在就创建
  const configVersion
    = dependencies['@commitlint/config-conventional']
    || devDependencies['@commitlint/config-conventional'];
  if (!configVersion) {
    pkgs.push('@commitlint/config-conventional');
  }

  if (pkgs.length) {
    pkgs.forEach((key) => {
      devDependencies[key] = devDeps[key];
    });
  }

  const configName = 'commitlint.config.js';

  if (files.includes(configName)) {
    ctx.fail(`配置文件 ${configName} 已存在.`);
    return next();
  }

  writeFileFrom(
    join(cwd, configName),
    join(rootPath, 'config/husky/commitlint.config.js')
  );

  ctx.done('配置 commitlint 完成.');
  next();
}
