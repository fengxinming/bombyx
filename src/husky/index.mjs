import { readFile, unlink, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import doLintStaged from './lint-staged.mjs';
import doCommitlint from './commitlint.mjs';
import {
  backupFile,
  installNpmPkg,
  runNpmPkg,
  updateFile,
  updateObject
} from '../shared/util.mjs';

const configFiles = ['.huskyrc', '.huskyrc.json'];

function checkVersion(version) {
  const major = /^(?:\^|~)?([0-9]+)/.exec(version);
  return (major && +major[1] >= 9) || version === 'latest';
}

async function addCommitHook(cwd, filePath, content) {
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
 * @param {import('../../types').todoOptions} params
 * @returns {Promise<string>}
 */
export default async function doHusky(params) {
  const { cwd, pkg, files, pkgHooks, record } = params;
  const { dependencies = {}, devDependencies = {} } = pkg;
  const huskyVersion = dependencies.husky || devDependencies.husky;

  // 未安装 husky
  if (!huskyVersion) {
    await installNpmPkg('husky');
  }
  // 版本过低
  else if (!checkVersion(huskyVersion)) {
    // 备份
    const huskyrc = files.find((f) => configFiles.includes(f));
    if (huskyrc) {
      backupFile(huskyrc, cwd).then(() => {
        return unlink(join(cwd, huskyrc));
      });
    }
    const { husky } = pkg;
    if (husky) {
      updateFile('husky.bak', husky, cwd);
      pkgHooks.push((newPkg) => {
        delete newPkg.husky;
      });
    }
  }
  else {
    await installNpmPkg('husky');
  }

  // 添加 prepare 脚本
  pkgHooks.push((newPkg) => {
    updateObject(newPkg, 'scripts.prepare', (prepare) => {
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
  });

  await runNpmPkg(['husky']);

  return Promise.all([
    addCommitHook(cwd, '.husky/pre-commit', 'npx --no-install -- lint-staged'),
    addCommitHook(
      cwd,
      '.husky/commit-msg',
      'npx --no-install -- commitlint --edit $1'
    ),
    doLintStaged(params),
    doCommitlint(params)
  ]).then(() => {
    record.success('配置 husky 完成.');
  });
}
