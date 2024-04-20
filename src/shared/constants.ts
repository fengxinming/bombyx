import figures from 'prompts/lib/util/figures.js';

export const devDeps = {
  '@commitlint/cli': '^19.2.0',
  '@commitlint/config-conventional': '^19.1.0',
  eslint: '^8.57.0',
  'eslint-config-fe': '^2.1.2',
  'eslint-plugin-react': '^7.34.1',
  'eslint-plugin-react-hooks': '^4.6.0',
  'eslint-plugin-simple-import-sort': '^12.1.0',
  '@babel/preset-react': '^7.24.1',
  husky: '^9.0.11',
  'lint-staged': '^15.2.2',
  react: '^16.8.0'
};

export const instructions = `
${figures.pointerSmall} 指示:
  ${figures.arrowUp}/${figures.arrowDown}: 高亮选项
  ${figures.arrowLeft}/${figures.arrowRight}/[空格键]: 切换选择
  a键: 选中所有
  回车键: 提交选项
`;

export const eslintConfigFiles = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  '.eslintrc.json'
];

export const huskyConfigFiles = ['.huskyrc', '.huskyrc.json'];

export const lintstagedConfigFiles = [
  '.lintstagedrc',
  '.lintstagedrc.js',
  '.lintstagedrc.cjs',
  '.lintstagedrc.mjs',
  '.lintstagedrc.yaml',
  '.lintstagedrc.yml',
  '.lintstagedrc.json',
  'lint-staged.config.js'
];
