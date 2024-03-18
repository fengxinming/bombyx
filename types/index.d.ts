export interface eslintOptions {
  /** 检查 typescript */
  ts?: boolean;
  /** 检查 react */
  react?: boolean;
}

export interface yslOptions {
  /** 当前工作目录 */
  cwd?: string;
  /** 配置eslint */
  eslint?: boolean | eslintOptions;
  /** 配置husky */
  husky?: boolean;
}

export declare function ysl(options: yslOptions): Promise<void>;

declare interface todoOptions {
  cwd: string;
  files: string[];
  pkg: {[key: string]: any};
  pkgHooks: Array<(pkg: {[key: string]: any}) => void>;
  record: {
    error: (val: string) => void;
    success: (val: string) => void;
    values: () => Array<{status: string, value: string}>;
  };
}
