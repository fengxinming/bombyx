import {
  createReadStream,
  createWriteStream,
  existsSync,
  readFileSync
} from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';
import { get, set } from 'lodash-es';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const rootPath = join(__dirname, '..');

/**
 * 安装npm包
 */
// export function installNpmPkg(pkgs: string|string[], args?: string|string[]) {
//   if (!args) {
//     args = '--save-dev';
//   }
//   return execa('npm', ['install'].concat(args).concat(pkgs));
// }

/**
 * 安装npm包
 */
export function installNpmPkg(pkgs: string|string[], args?: string|string[]) {
  if (!args) {
    args = '--save-dev';
  }
  return execa('npm', ['install'].concat(args).concat(pkgs));
}

/**
 * 执行npm模块
 */
export function runNpmPkg(args: string|string[], install?: boolean) {
  return execa('npx', (install ? ['--'] : ['--no-install', '--']).concat(args));
}

/**
 * 读取json文件
 */
export function readFile(pth: string, cwd?: string): string {
  if (!cwd) {
    cwd = rootPath;
  }
  if (!isAbsolute(pth)) {
    pth = join(cwd, pth);
  }
  return readFileSync(pth, 'utf-8');
}

/**
 * 读取json文件
 */
export function readJsonFile(relativePath: string, cwd?: string): Record<string, any> {
  return JSON.parse(readFile(relativePath, cwd));
}

export const rootPkg = readJsonFile('package.json');

/**
 * 生成文件
 */
export function updateFile(
  pth: string,
  content: any,
  cwd?: string
): Promise<void> {
  if (!isAbsolute(pth) && cwd) {
    pth = join(cwd, pth);
  }
  return writeFile(
    pth,
    typeof content === 'string'
      ? content
      : JSON.stringify(content, null, 2) + EOL,
    'utf-8'
  );
}

/**
 * 将一个文件写入到另一个文件
 */
export function writeFileFrom(to: string, from: string): Promise<string> {
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
 * 备份文件
 */
export function backupFile(relativePath: string, cwd?: string): Promise<string> {
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
 * 更新或者删除对象中的属性
 */
export function updateObject(obj: Record<string, any>, key: string, value?: any): void {
  const type = typeof value;
  if (type === 'function') {
    updateObject(obj, key, value(get(key)));
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
