import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import pt from './locales/pt';
import en from './locales/en';
import es from './locales/es';

const deviceLang = getLocales()[0]?.languageCode ?? 'pt';

const supportedLangs = ['pt', 'en', 'es'];
const lng = supportedLangs.includes(deviceLang) ? deviceLang : 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources: { pt: { translation: pt }, en: { translation: en }, es: { translation: es } },
    lng,
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  });

export default i18n;
