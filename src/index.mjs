import { dirname } from 'node:path';
import { readdir } from 'node:fs/promises';
import doHusky from './husky/index.mjs';
import doEslint from './eslint.mjs';
import { createRecord, readJsonFile, updateFile } from './shared/util.mjs';

function getPkg(cwd) {
  try {
    return readJsonFile('package.json', cwd);
  }
  catch (err) {
    // 找不到文件
    if (err.code === 'ENOENT') {
      const pkg = {
        name: dirname(cwd),
        version: '1.0.0'
      };
      return pkg;
    }
    throw err;
  }
}

/**
 * 补全项目配置
 *
 * @param {import('../types').yslOptions} opts
 * @returns {Promise<void>}
 */
export async function ysl(opts = {}) {
  const { cwd = process.cwd(), eslint, husky } = opts;

  /** @type {import('../types').todoOptions} */
  const params = {
    cwd,
    files: await readdir(cwd),
    pkg: await getPkg(cwd),
    pkgHooks: [],
    record: createRecord()
  };

  const promises = [];

  if (eslint) {
    promises.push(doEslint(params, eslint === true ? {} : eslint));
  }

  if (husky) {
    promises.push(doHusky(params));
  }

  return Promise.all(promises)
    .then(() => getPkg(cwd))
    .then((latestPkg) => {
      params.pkgHooks.forEach((hook) => {
        hook(latestPkg);
      });
      updateFile('package.json', latestPkg, cwd);
      return params.record.values();
    });
}
