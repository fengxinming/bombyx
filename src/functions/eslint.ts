import { join } from 'node:path';

import { devDeps, eslintConfigFiles } from '../shared/constants';
import Context from '../shared/context';
import intl from '../shared/intl';
import {
  rootPath,
  updateFile,
  updateObject,
  writeFileFrom
} from '../shared/util';
import { EslintOptions } from '../typings';

/**
 * 创建eslint配置文件
 */
function makeEslintrc(cwd: string, opts: EslintOptions) {
  const eslintConfig = {
    extends: ['fe'],
    plugins: ['simple-import-sort'],
    globals: {
      __DEV__: true
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    }
  };

  if (opts.ts) {
    eslintConfig.extends.push('fe/ts');
  }
  if (opts.react) {
    eslintConfig.extends.push('fe/react');
  }

  return updateFile('.eslintrc', eslintConfig, cwd);
}

/**
 * 配置 eslint
 */
export default async function doEslint(
  ctx: Context,
  next: () => void
): Promise<void> {
  const {
    pkg,
    files,
    cwd,
    opts
  } = ctx;

  let eslint = opts.eslint;
  if (!eslint) {
    return next();
  }

  if (eslint === true) {
    eslint = {};
  }

  const { dependencies = {}, devDependencies = {} } = pkg as Record<string, any>;
  const eslintVersion = dependencies.eslint || devDependencies.eslint;

  // 未安装 eslint
  if (!eslintVersion) {
    devDependencies.eslint = devDeps.eslint;
  }

  // 在 package.json 中添加 eslint 执行脚本
  updateObject(pkg, 'scripts.eslint', (eslint) => {
    return eslint
      ? null
      : 'eslint --ext .js,.mjs,.jsx,.ts,.tsx --fix --ignore-path .eslintignore ./';
  });

  // 未配置 eslintignore
  const eslintignore = '.eslintignore';
  if (!files.includes(eslintignore)) {
    writeFileFrom(
      join(cwd, eslintignore),
      join(rootPath, 'config/eslint/eslintignore.txt')
    );
  }

  const eslintConfigFile = files.find((n) => eslintConfigFiles.includes(n));

  // 不存在配置
  if (!eslintConfigFile) {
    // 读取 eslintConfig 配置
    const { eslintConfig } = pkg;
    if (eslintConfig) {
      ctx.fail(intl.get('error.config.exists', { config: 'eslintConfig' }));
      return next();
    }
  }
  else {
    ctx.fail(intl.get('error.file.exists', { file: eslintConfigFile }));
    return next();
  }

  const pkgs = ['eslint-config-fe', 'eslint-plugin-simple-import-sort'];
  if (eslint.react) {
    pkgs.push(
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      '@babel/preset-react'
    );
    const reactVersion = dependencies.react || devDependencies.react;
    if (!reactVersion) {
      pkgs.push('react');
      devDependencies.eslint = devDeps.eslint;
    }
  }
  pkgs.forEach((key) => {
    devDependencies[key] = devDeps[key];
  });

  // 生成配置文件
  makeEslintrc(cwd, eslint);

  ctx.done(intl.get('log.set.done', { name: 'eslint' }));
  next();
}
