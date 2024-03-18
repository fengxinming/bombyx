import { fileURLToPath, URL } from 'node:url';
import {
  createReadStream,
  createWriteStream,
  readFileSync,
  existsSync
} from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EOL } from 'node:os';
import figures from 'prompts/lib/util/figures.js';
import { execa } from 'execa';
import { get, set } from 'lodash-es';

export const rootPath = fileURLToPath(new URL('../../', import.meta.url));
export const yslPkg = readJsonFile('package.json');

export const instructions = `
${figures.pointerSmall} 指示:
  ${figures.arrowUp}/${figures.arrowDown}: 高亮选项
  ${figures.arrowLeft}/${figures.arrowRight}/[空格键]: 切换选择
  a键: 选中所有
  回车键: 提交选项
`;

/**
 * 安装npm包
 * @param {string|string[]} pkgs
 * @param {string|string[]=} args
 */
export function installNpmPkg(pkgs, args) {
  if (!args) {
    args = '--save-dev';
  }
  return execa('npm', ['install'].concat(args).concat(pkgs));
}

/**
 * 执行npm模块
 * @param {string|string[]} args
 * @param {boolean=} install
 */
export function runNpmPkg(args, install) {
  return execa('npx', (install ? ['--'] : ['--no-install', '--']).concat(args));
}

/**
 * 读取json文件
 * @param {string} relativePath
 * @param {string=} cwd
 */
export function readFile(relativePath, cwd) {
  if (!cwd) {
    cwd = rootPath;
  }
  return readFileSync(join(cwd, relativePath), 'utf-8');
}

/**
 * 读取json文件
 * @param {string} relativePath
 * @param {string=} cwd
 */
export function readJsonFile(relativePath, cwd) {
  return JSON.parse(readFile(relativePath, cwd));
}

/**
 * 生成文件
 * @param {string} relativePath
 * @param {string | {[key: string]: any}} content
 * @param {string=} cwd
 */
export function updateFile(relativePath, content, cwd) {
  if (cwd) {
    relativePath = join(cwd, relativePath);
  }
  return writeFile(
    relativePath,
    typeof content === 'string'
      ? content
      : JSON.stringify(content, null, 2) + EOL,
    'utf-8'
  );
}

/**
 * 备份文件
 * @param {string} relativePath
 * @param {string=} cwd
 * @returns {Promise<string>}
 */
export function backupFile(relativePath, cwd) {
  if (cwd) {
    relativePath = join(cwd, relativePath);
  }
  let fileName = `${relativePath}.bak`;
  if (existsSync(fileName)) {
    fileName = `${relativePath}-${Date.now()}.bak`;
  }
  return writeFileFrom(fileName, relativePath);
}

/**
 * 将一个文件写入到另一个文件
 * @param {string} to
 * @param {string} from
 * @returns
 */
export function writeFileFrom(to, from) {
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(to, 'utf-8')
      .on('finish', () => {
        resolve(to);
      })
      .on('error', (err) => {
        reject(err);
      });
    createReadStream(from, 'utf-8').pipe(writeStream);
  });
}

/**
 * 更新或者删除对象中的属性
 * @param {object} obj
 * @param {string} key
 * @param {string | ((val: string) => string)=} value
 */
export function updateObject(obj, key, value) {
  const type = typeof value;
  if (type === 'function') {
    const newVal = value(get(key));
    if (newVal != null) {
      set(obj, key, newVal);
    }
  }
  else if (type !== 'undefined') {
    set(obj, key, value);
  }
  else {
    const remove = new Function('obj', `return delete obj.${key}`);
    try {
      remove(obj);
    }
    catch (e) {}
  }
}

/**
 *
 * @returns {import('../../types').todoOptions}
 */
export function createRecord() {
  const values = [];
  return {
    error(val) {
      values.push({ status: 'error', reason: val });
    },
    success(val) {
      values.push({ status: 'success', value: val });
    },
    values() {
      return values;
    }
  };
}
