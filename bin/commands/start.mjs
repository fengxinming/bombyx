import prompts from 'prompts';
import { isAbsolute, join } from 'node:path';
import { statSync, existsSync } from 'node:fs';
import figures from 'prompts/lib/util/figures.js';
import kleur from 'kleur';

import { ysl } from '../../src/index.mjs';
import { spinner } from '../../src/shared/spinner.mjs';
import { instructions } from '../../src/shared/util.mjs';

const eslintTitle = '添加 eslint 支持';
const eslintTsTitle = '适配 typescript 相关';
const eslintReactTitle = '适配 react 相关';
const huskyTitle = '添加 husky、lint-staged、commitlint 支持';

async function complete(root, { eslint, husky, build } = {}) {
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

  if (eslint === void 0 && husky === void 0 && build === void 0) {
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
              { title: huskyTitle, value: 'husky' },
            ],
            min: 1,
            hint: '- 手动选择以下配置项',
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
              { title: eslintReactTitle, value: 'react' },
            ],
            hint: '- 非必要配置可不选',
          },
        ],
        {
          onCancel() {
            throw new Error(`${kleur.red(figures.cross)} 操作被取消.`);
          },
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
              eslint.ts = true;
              break;
            case 'react':
              eslint.react = true;
              break;
          }
        });
      }
    } catch (cancelled) {
      console.error(cancelled.message);
      process.exit(1);
    }
  }

  spinner.start('正在配置开发环境...');

  try {
    /** @type{Promise<{ value?:string; reason?:string }>[]} */
    const res = await ysl({
      cwd,
      eslint,
      husky,
      build,
    });

    if (res.length) {
      res.forEach(({ value, reason }) => {
        if (value) {
          spinner.done(value);
        } else if (reason) {
          spinner.fail(reason);
        }
      });
    } else {
      spinner.fail('配置开发环境失败.');
    }
  } catch (e) {
    spinner.fail('配置开发环境中断.');
    throw e;
  }
}

/**
 * 默认执行命令
 *
 * @param {import('cac').CAC} cli
 */
export default function start(cli) {
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
