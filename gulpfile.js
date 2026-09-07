import { src, dest } from 'gulp';
import through from 'through2';
import * as XLSX from 'xlsx';
import * as path from 'path';
import Vinyl from 'vinyl';

// 支持的语言列表
const LANGUAGES = ['en', 'zh', 'id', 'tw', 'th', 'ru', 'vi', 'es', 'pt', 'ja', 'uk', 'ko', 'de', 'fr'];

function excel2i18n() {
  const stream = through.obj(function(file, encode, cb) {
    if (!file.isBuffer()) {
      return cb(null, file);
    }

    const workbook = XLSX.read(file.contents);
    const excelData = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']);

    // 为每种语言创建一个翻译对象
    const translations = {};
    LANGUAGES.forEach(lang => {
      translations[lang] = {};
    });

    // 解析 Excel 数据
    excelData.forEach(row => {
      let parsedRow = {};
      for (const key in row) {
        const letterPattern = /[a-zA-Z]+/g;
        const matches = key.match(letterPattern);
        if (matches) {
          const normalizedKey = matches[0].toLowerCase();
          parsedRow[normalizedKey] = row[key].replace(/@{/g, '{');
        }
      }

      // 将每种语言的翻译添加到对应的对象中
      if (parsedRow.key) {
        LANGUAGES.forEach(lang => {
          if (parsedRow[lang]) {
            translations[lang][parsedRow.key] = parsedRow[lang];
          }
        });
      }
    });

    // 为每种语言生成一个 JSON 文件
    LANGUAGES.forEach(lang => {
      if (Object.keys(translations[lang]).length > 0) {
        const langFile = new Vinyl({
          base: file.base,
          path: path.join(file.base, `${lang}.json`),
          contents: Buffer.from(JSON.stringify(translations[lang], null, '\t'))
        });
        this.push(langFile);
      }
    });

    cb();
  });

  return stream;
}

// Note: Localization is version-controlled directly via i18n/locales/vi.json and en.json.
// External spreadsheet overwrites have been deprecated to prevent silent data loss.
function i18nWrite(cb) {
  console.log('Localization source of truth is i18n/locales/*.json. Excel sync is disabled.');
  if (cb) cb();
}

export { i18nWrite };
