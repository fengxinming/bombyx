import { EventEmitter } from 'node:events';

import boxen from 'boxen';
import { CAC } from 'cac';
import kleur from 'kleur';
import prompts from 'prompts';
import figures from 'prompts/lib/util/figures.js';

import { bombyx } from '../index';
import { instructions } from '../shared/constants';
import intl from '../shared/intl';
import { spinner } from '../shared/spinner';
import { EslintOptions, Options, UserSelection } from '../typings';

function onCancel() {
  throw new Error(`${intl.get('error.operation.cancelled', { figure: kleur.red(figures.cross) })}.`);
}

async function complete(root: string | undefined, { lang, eslint, husky }: Options): Promise<void> {
  try {
    if (lang === void 0) {
      const langSelection: Record<string, string> = await prompts(
        {
          type: 'select',
          name: 'lang',
          message: 'Select a language: ',
          choices: [
            { title: 'English', value: 'en_us' },
            { title: '简体中文', value: 'zh_cn' }
          ],
          hint: '- Select one of the following languages manually.'
        },
        {
          onCancel
        }
      );
      lang = langSelection.lang;
    }

    intl.lang = lang;

    if (eslint === void 0 && husky === void 0) {
      const selection: UserSelection = await prompts(
        [
          {
            type: 'multiselect',
            name: 'functions',
            instructions: lang === 'zh_cn' ? instructions : undefined,
            message: intl.get('message.select.functions'),
            choices: [
              { title: intl.get('choice.eslint'), value: 'eslint' },
              { title: intl.get('choice.husky'), value: 'husky' }
            ],
            min: 1,
            hint: `- ${intl.get('hint.multiselect')}`
          },
          {
            type(prev) {
              return prev.includes('eslint') ? 'multiselect' : null;
            },
            name: 'eslintExtra',
            instructions: lang === 'zh_cn' ? instructions : undefined,
            message: intl.get('message.select.eslint.config'),
            choices: [
              { title: intl.get('choice.eslint.ts'), value: 'ts' },
              { title: intl.get('choice.eslint.react'), value: 'react' }
            ],
            hint: `- ${intl.get('hint.optional')}`
          }
        ],
        {
          onCancel
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
  }
  catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }

  spinner.start(intl.get('log.setting'));

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
      cwd: root,
      eslint,
      husky,
      emitter
    });
  }
  catch (e) {
    spinner.fail(intl.get('error.setting.cancelled'));
    throw e;
  }

  // eslint-disable-next-line no-console
  console.log(boxen(intl.get('log.install'), { padding: 1 }));
}

/**
 * 默认执行命令
 */
export default function start(cli: CAC) {
  cli
    .command('[dir]', `${intl.get('command.start')}`)
    .alias('start')
    .option('--lang', `${intl.get('option.lang')}`)
    .option(
      '--eslint',
      `${intl.get('choice.eslint')}
    --eslint.ts      ${intl.get('choice.eslint.ts')}
    --eslint.react   ${intl.get('choice.eslint.react')}
`
    )
    .option('--husky', `${intl.get('choice.husky')}`)
    .example((name) => {
      return `
  $ ${name}                     # ${intl.get('command.start')}
  $ ${name} --eslint            # ${intl.get('choice.eslint')}
`;
    })
    .action(complete);
}
