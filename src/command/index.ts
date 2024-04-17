import cac from 'cac';

import banner from '../shared/banner';
import intl from '../shared/intl';
import { rootPkg } from '../shared/util';
import start from './start';

function helpCallback(sections: Array<{title?: string, body: string}>) {
  if (intl.lang === 'zh_cn') {
    for (const section of sections) {
      if (section.title === 'Options') {
        section.body = section.body
          .replace('Display version number', '显示版本信息.')
          .replace('Display this message', '显示帮助信息.');
        break;
      }
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

cli.version(rootPkg.version).help(helpCallback);

cli.parse(process.argv);
