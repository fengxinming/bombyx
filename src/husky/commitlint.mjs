import { join } from 'node:path';
import { installNpmPkg, rootPath, writeFileFrom } from '../shared/util.mjs';

/**
 * 配置 commitlint
 * @param {import('../../types').todoOptions} param0
 * @returns {Promise<void>}
 */
export default async function doCommitlint({ cwd, files, pkg, record }) {
  const { dependencies = {}, devDependencies = {} } = pkg;
  const cliVersion
    = dependencies['@commitlint/cli'] || devDependencies['@commitlint/cli'];

  const pkgs = [];
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
    await installNpmPkg(pkgs);
  }

  const configName = 'commitlint.config.js';

  if (files.includes(configName)) {
    record.error(`配置文件 ${configName} 已存在.`);
    return;
  }

  writeFileFrom(
    join(cwd, configName),
    join(rootPath, 'config/husky/commitlint.config.js')
  );

  record.success('配置 commitlint 完成.');
}
