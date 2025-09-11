import en from './locales/en.json';
import ko from './locales/ko.json';

const translations = {
  en,
  ko,
};

export function getTranslation(lang, key, vars = {}) {
  const keys = key.split('.');
  let text = translations[lang];

  for (const k of keys) {
    if (text && text[k] !== undefined) {
      text = text[k];
    } else {
      // Fallback to English if translation not found
      text = translations['en'];
      for (const ek of keys) {
        if (text && text[ek] !== undefined) {
          text = text[ek];
        } else {
          return `[MISSING_TRANSLATION: ${key}]`;
        }
      }
      break;
    }
  }

  if (typeof text === 'string') {
    return text.replace(/{{(\w+)}}/g, (match, p1) => vars[p1] !== undefined ? vars[p1] : match);
  }
  return text;
}