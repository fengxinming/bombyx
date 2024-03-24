import { join } from 'node:path';
import {
  installNpmPkg,
  rootPath,
  updateFile,
  updateObject,
  writeFileFrom
} from './shared/util.mjs';

const configFiles = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  '.eslintrc.json'
];

/**
 *
 * @param {string} cwd
 * @param {import('../types').eslintOptions} opts
 */
function makeEslintrc(cwd, opts) {
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
 * @param {import('../types').todoOptions} params
 * @param {import('../types').eslintOptions} opts
 * @returns {Promise<string>}
 */
export default async function doEslint(
  { cwd, files, pkg, pkgHooks, record },
  opts
) {
  const { dependencies = {}, devDependencies = {} } = pkg;
  const eslintVersion = dependencies.eslint || devDependencies.eslint;

  // 未安装 eslint
  if (!eslintVersion) {
    await installNpmPkg('eslint');
  }

  // 未配置 eslintignore
  const eslintignore = '.eslintignore';
  if (!files.includes(eslintignore)) {
    writeFileFrom(
      join(cwd, eslintignore),
      join(rootPath, 'config/eslint/eslintignore.txt')
    );
  }

  // 在 package.json 中添加 eslint 执行脚本
  pkgHooks.push((newPkg) => {
    updateObject(newPkg, 'scripts.eslint', (eslint) => {
      return eslint
        ? null
        : 'eslint --ext .js,.mjs,.jsx,.ts,.tsx --fix --ignore-path .eslintignore ./';
    });
  });

  const eslintConfigFile = files.find((n) => configFiles.includes(n));

  // 不存在配置
  if (!eslintConfigFile) {
    // 读取 eslintConfig 配置
    const { eslintConfig } = pkg;
    if (eslintConfig) {
      record.error('在 package.json 中已存在 eslintConfig 配置.');
      return;
    }
  }
  else {
    record.error(`配置文件 ${eslintConfigFile} 已存在.`);
    return;
  }

  const pkgs = ['eslint-config-fe', 'eslint-plugin-simple-import-sort'];
  if (opts.react) {
    pkgs.push(
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      '@babel/preset-react'
    );
    const reactVersion = dependencies.react || devDependencies.react;
    if (!reactVersion) {
      pkgs.push('react');
    }
  }
  await installNpmPkg(pkgs);
  makeEslintrc(cwd, opts);

  record.success('配置 eslint 完成.');
}
