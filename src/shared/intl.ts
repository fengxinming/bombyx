import { readJsonFile } from './util';

class Intl {
  private _lang!: string;
  private _messages!: Record<string, string>;

  constructor() {
    this.lang = 'en_us';
  }

  get lang() {
    return this._lang;
  }

  set lang(lang: string) {
    if (!lang) {
      lang = 'en_us';
    }
    switch (lang) {
      case 'en_us':
      case 'zh_cn':
        break;
      default:
        throw new Error('Only support \'en_us\' and \'zh_cn\'.');
    }
    this._lang = lang;
    this._messages = readJsonFile(`./i18n/${this._lang}.json`);
  }

  get(key: string, replacements?: Record<string, string> | any[]) {
    let text = this._messages[key];
    if (replacements) {
      text = text.replace(/\{\s*(\w+)\s*\}/g, (_, key) => {
        return replacements[key];
      });
    }
    return text;
  }
}

export default new Intl();
