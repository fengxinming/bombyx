import { join } from 'node:path';
import { installNpmPkg, rootPath, writeFileFrom } from '../shared/util.mjs';

const configurationFiles = [
  '.lintstagedrc',
  '.lintstagedrc.js',
  '.lintstagedrc.cjs',
  '.lintstagedrc.mjs',
  '.lintstagedrc.yaml',
  '.lintstagedrc.yml',
  '.lintstagedrc.json',
  'lint-staged.config.js'
];

/**
 * 配置 lint-staged
 * @param {import('../../types').todoOptions} param0
 * @returns {Promise<void>}
 */
export default async function doLintStaged({ cwd, files, pkg, record }) {
  const { dependencies = {}, devDependencies = {} } = pkg;
  const lintStagedVersion
    = dependencies['lint-staged'] || devDependencies['lint-staged'];

  // 未安装 lint-staged
  if (!lintStagedVersion) {
    await installNpmPkg('lint-staged');
  }

  const lintStagedConfigFile = files.find((n) =>
    configurationFiles.includes(n)
  );
  if (!lintStagedConfigFile) {
    // 读取 lint-staged 配置
    if (pkg['lint-staged']) {
      record.error('在 package.json 中已存在 lint-staged 配置.');
      return;
    }
  }
  else {
    record.error(`配置文件 ${lintStagedConfigFile} 已存在.`);
    return;
  }

  writeFileFrom(
    join(cwd, '.lintstagedrc'),
    join(rootPath, 'config/husky/lintstagedrc.json')
  );

  record.success('配置 lint-staged 完成.');
}
