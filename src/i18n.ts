export type Lang = 'en' | 'de';

const translations = {
  en: {
    fetching: 'fetching...',
    you_found_it: 'you found it.',
    mark_location: 'mark your location',
    enter_manually: 'enter manually instead',
    placeholder_street: 'street / neighborhood',
    placeholder_postcode: 'postcode',
    placeholder_city: 'city',
    confirm: 'confirm',
    edit: 'edit',
    locating: 'locating...',
    city_required: 'city is required.',
    logging: 'logging...',
    api_not_configured: 'api not configured.',
    logged: '● logged.',
    found_at: 'found at',
    something_wrong: 'something went wrong. try again.',
    network_error: 'network error. try again.',
    artwork_not_found: 'artwork not found.',
  },
  de: {
    fetching: 'laden...',
    you_found_it: 'du hast es gefunden.',
    mark_location: 'standort markieren',
    enter_manually: 'manuell eingeben',
    placeholder_street: 'straße / viertel',
    placeholder_postcode: 'postleitzahl',
    placeholder_city: 'stadt',
    confirm: 'bestätigen',
    edit: 'bearbeiten',
    locating: 'orten...',
    city_required: 'stadt ist erforderlich.',
    logging: 'speichern...',
    api_not_configured: 'api nicht konfiguriert.',
    logged: '● gespeichert.',
    found_at: 'gefunden in',
    something_wrong: 'etwas ist schiefgelaufen. erneut versuchen.',
    network_error: 'netzwerkfehler. erneut versuchen.',
    artwork_not_found: 'kunstwerk nicht gefunden.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

let currentLang: Lang = (localStorage.getItem('lang') as Lang) || 'en';

const listeners: Array<() => void> = [];

export function t(key: TranslationKey): string {
  return translations[currentLang][key];
}

export function getLang(): Lang {
  return currentLang;
}

export function onLangChange(cb: () => void): void {
  listeners.push(cb);
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyDataI18n();
  listeners.forEach(cb => cb());
}

export function applyDataI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n') as TranslationKey;
    if (key in translations[currentLang]) {
      el.textContent = translations[currentLang][key];
    }
  });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder') as TranslationKey;
    if (key in translations[currentLang]) {
      el.placeholder = translations[currentLang][key];
    }
  });
}
