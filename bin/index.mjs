#!/usr/bin/env node

import cac from 'cac';
import banner from '../src/shared/banner.mjs';
import { yslPkg } from '../src/shared/util.mjs';
import start from './commands/start.mjs';

/**
 *
 * @param {{title?: string; body: string;}} sections
 */
function helpCallback(sections) {
  for (const section of sections) {
    if (section.title === 'Options') {
      section.body = section.body
        .replace('Display version number', '显示版本信息.')
        .replace('Display this message', '显示帮助信息.');
      break;
    }
  }
}

// 大标题
banner('welcome !', {
  font: 'ANSI Shadow'
});

// 创建命令终端
const cli = cac();

start(cli);

cli.version(yslPkg.version).help(helpCallback);

cli.parse(process.argv);
