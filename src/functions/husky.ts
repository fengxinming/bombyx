import { existsSync } from 'node:fs';
import { appendFile, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { devDeps, huskyConfigFiles, lintstagedConfigFiles } from '../shared/constants';
import Context from '../shared/context';
import intl from '../shared/intl';
import {
  backupFile,
  rootPath,
  runNpmPkg,
  updateFile,
  updateObject,
  writeFileFrom
} from '../shared/util';

function checkVersion(version: string): boolean {
  const major = /^(?:\^|~)?([0-9]+)/.exec(version);
  return (major && +major[1] >= 9) || version === 'latest';
}

async function addCommitHook(
  cwd: string,
  filePath: string,
  content: string
): Promise<void> {
  const hookFilePath = join(cwd, filePath);
  if (existsSync(hookFilePath)) {
    try {
      const preCommit = await readFile(hookFilePath, 'utf-8');
      if (preCommit.includes(content)) {
        return;
      }
    }
    catch (e) {}
    return appendFile(filePath, content, 'utf-8');
  }

  return writeFile(filePath, content, 'utf-8');
}

/**
 * 配置 commitlint
 */
function doCommitLint(
  ctx: Context
): void {
  const {
    pkg,
    files,
    cwd
  } = ctx;

  let { dependencies, devDependencies } = pkg as Record<string, any>;
  if (!dependencies) {
    dependencies = {};
    pkg.dependencies = dependencies;
  }
  if (!devDependencies) {
    devDependencies = {};
    pkg.devDependencies = devDependencies;
  }

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
    ctx.fail(intl.get('error.file.exists', { file: configName }));
    return;
  }

  writeFileFrom(
    join(cwd, configName),
    join(rootPath, 'config/husky/commitlint.config.js')
  );

  addCommitHook(
    cwd,
    '.husky/commit-msg',
    'npx --no-install -- commitlint --edit $1'
  );

  ctx.done(intl.get('log.set.done', { name: 'commitlint' }));
}

function doLintStaged(
  ctx: Context
): void {
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
      ctx.fail(intl.get('error.config.exists', { config: 'lint-staged' }));
      return;
    }
  }
  else {
    ctx.fail(intl.get('error.file.exists', { file: lintStagedConfigFile }));
    return;
  }

  writeFileFrom(
    join(cwd, '.lintstagedrc'),
    join(rootPath, 'config/husky/lintstagedrc.json')
  );

  addCommitHook(
    cwd,
    '.husky/pre-commit',
    'npx --no-install -- lint-staged'
  );

  ctx.done(intl.get('log.set.done', { name: 'lint-staged' }));
}

/**
 * 配置 husky
 */
export default async function doHusky(
  ctx: Context,
  next: () => void
): Promise<void> {
  const {
    pkg,
    files,
    cwd,
    opts
  } = ctx;

  const husky = opts.husky;
  if (!husky) {
    return next();
  }

  const { dependencies = {}, devDependencies = {} } = pkg as Record<string, any>;
  const huskyVersion = dependencies.husky || devDependencies.husky;

  // 未安装 husky
  if (!huskyVersion) {
    devDependencies.husky = devDeps.husky;
  }
  // 版本过低
  else if (!checkVersion(huskyVersion)) {
    // 备份
    const huskyrc = files.find((f) => huskyConfigFiles.includes(f));
    if (huskyrc) {
      backupFile(huskyrc, cwd).then(() => {
        return unlink(join(cwd, huskyrc));
      });
    }
    const { husky } = pkg;
    if (husky) {
      updateFile('husky.bak', husky, cwd);
      delete pkg.husky;
    }
  }

  // 添加 prepare 脚本
  updateObject(pkg, 'scripts.prepare', (prepare) => {
    if (prepare) {
      if (prepare.includes('husky')) {
        return;
      }
      prepare += ' && ';
    }
    else {
      prepare = '';
    }
    return `${prepare}husky`;
  });

  await runNpmPkg([`husky@${devDependencies.husky.match(/\d/)[0]}`], !existsSync(join(cwd, 'node_modules', 'husky')));

  doLintStaged(ctx);
  doCommitLint(ctx);

  ctx.done(intl.get('log.set.done', { name: 'husky' }));
  next();
}
