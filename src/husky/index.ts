import { existsSync } from 'node:fs';
import { appendFile, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { devDeps, huskyConfigFiles } from 'src/shared/constants.js';

import Context from '../shared/context';
import {
  backupFile,
  runNpmPkg,
  updateFile,
  updateObject
} from '../shared/util';
import doCommitlint from './commitlint.js';
import doLintStaged from './lint-staged.js';

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

  await runNpmPkg(['husky']);

  ctx.use(doLintStaged);
  ctx.use(doCommitlint);

  return Promise.all([
    addCommitHook(
      cwd,
      '.husky/pre-commit',
      'npx --no-install -- lint-staged'
    ),
    addCommitHook(
      cwd,
      '.husky/commit-msg',
      'npx --no-install -- commitlint --edit $1'
    )
  ]).then(() => {
    ctx.done('配置 husky 完成.');
  });
}
