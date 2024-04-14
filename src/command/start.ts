import { EventEmitter } from 'node:events';
import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import { CAC } from 'cac';
import kleur from 'kleur';
import prompts from 'prompts';
import figures from 'prompts/lib/util/figures.js';

import { bombyx } from '../index';
import { instructions } from '../shared/constants';
import { spinner } from '../shared/spinner';
import { EslintOptions, Options } from '../typings';

const eslintTitle = '添加 eslint 支持';
const eslintTsTitle = '适配 typescript 相关';
const eslintReactTitle = '适配 react 相关';
const huskyTitle = '添加 husky、lint-staged、commitlint 支持';

async function complete(root: string | undefined, { eslint, husky }: Options) {
  let cwd = root || void 0;
  if (cwd) {
    if (!isAbsolute(cwd)) {
      cwd = join(process.cwd(), cwd);
    }
    if (!existsSync(cwd)) {
      console.error(`${root} 目录不存在.`);
      process.exit(1);
    }
    if (!statSync(cwd).isDirectory()) {
      console.error(`${root} 不是目录.`);
      process.exit(1);
    }
  }

  if (eslint === void 0 && husky === void 0) {
    try {
      /** @type{{functions: string[], eslintExtra: string[]}} */
      const selection = await prompts(
        [
          {
            type: 'multiselect',
            name: 'functions',
            instructions: instructions,
            message: '选择需要添加的功能: ',
            choices: [
              { title: eslintTitle, value: 'eslint' },
              { title: huskyTitle, value: 'husky' }
            ],
            min: 1,
            hint: '- 手动选择以下配置项'
          },
          {
            type(prev) {
              return prev.includes('eslint') ? 'multiselect' : null;
            },
            name: 'eslintExtra',
            instructions,
            message: '选择额外的 Eslint 配置: ',
            choices: [
              { title: eslintTsTitle, value: 'ts' },
              { title: eslintReactTitle, value: 'react' }
            ],
            hint: '- 非必要配置可不选'
          }
        ],
        {
          onCancel() {
            throw new Error(`${kleur.red(figures.cross)} 操作被取消.`);
          }
        }
      );

      const { functions, eslintExtra = [] } = selection;
      functions.forEach((f) => {
        switch (f) {
          case 'eslint':
            eslint = true;
            break;
          case 'husky':
            husky = true;
            break;
        }
      });

      if (eslint) {
        eslint = {};
        eslintExtra.forEach((p) => {
          switch (p) {
            case 'ts':
              (eslint as EslintOptions).ts = true;
              break;
            case 'react':
              (eslint as EslintOptions).react = true;
              break;
          }
        });
      }
    }
    catch (cancelled: any) {
      console.error(cancelled.message);
      process.exit(1);
    }
  }

  spinner.start('正在配置开发环境...');

  const emitter = new EventEmitter();
  emitter.on('log', (type, msg) => {
    switch (type) {
      case 'done':
        spinner.done(msg);
        break;
      case 'fail':
        spinner.fail(msg);
        break;
    }
  });

  try {
    await bombyx({
      cwd,
      eslint,
      husky,
      emitter
    });
  }
  catch (e) {
    spinner.fail('配置开发环境中断.');
    throw e;
  }
}

/**
 * 默认执行命令
 */
export default function start(cli: CAC) {
  cli
    .command('[dir]', '配置代码环境.')
    .alias('start')
    .option(
      '--eslint',
      `${eslintTitle}.
    --eslint.ts      ${eslintTsTitle}.
    --eslint.react   ${eslintReactTitle}.
`
    )
    .option('--husky', `${huskyTitle}.`)
    .example((name) => {
      return `
  $ ${name}                     # 启动选项窗口
  $ ${name} --eslint            # ${eslintTitle}
`;
    })
    .action(complete);
}
