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
    logged: 'logged.',
    found_at: 'found at',
    something_wrong: 'something went wrong. try again.',
    network_error: 'network error. try again.',
    artwork_not_found: 'artwork not found.',
    acknowledge_continue: 'acknowledge and continue',
    view_object_record: 'view object record',
    contact: 'contact',
    cert_title: 'CERTIFICATE OF PASSAGE<br>& STEWARDSHIP',
    cert_body: '<p>The maker hereby requests and authorises all those who encounter this object to receive it freely, without hesitation or guilt, and without claim of ownership by any prior party. Possession without asking is recognised here as sufficient — and as the most direct declaration that the object was wanted.</p><p><strong>On the matter of care:</strong> The bearer is respectfully asked to shield this object from prolonged direct sunlight, which may in time diminish its surface. It requires no special treatment beyond that afforded to any object kept in a home.</p><p><strong>On the matter of commerce:</strong> Should the bearer wish to sell, trade, or exchange this object for profit, they are expressly encouraged to do so. No permission need be sought. The maker makes no claim.</p><p><strong>On the matter of provenance:</strong> This object carries a record. The code printed herein may be scanned at any point in its life — by the finder, a future owner, or a stranger passing through. Each scan adds a mark to its map. The object asks only this: that it remain scannable, and that its travels, however modest, continue to be known. No personal information is requested, and none is retained.</p><p class="scan-cert-footer"><em>Issued without condition. Valid wherever this object may travel.</em></p>',
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
    logged: 'gespeichert.',
    found_at: 'gefunden in',
    something_wrong: 'etwas ist schiefgelaufen. erneut versuchen.',
    network_error: 'netzwerkfehler. erneut versuchen.',
    artwork_not_found: 'kunstwerk nicht gefunden.',
    acknowledge_continue: 'zur kenntnis nehmen und fortfahren',
    view_object_record: 'objekt ansehen',
    contact: 'kontakt',
    cert_title: 'PASSIERSCHEIN<br>& TREUHÄNDSCHAFT',
    cert_body: '<p>Der Urheber ersucht hiermit alle, die diesem Objekt begegnen, es frei — ohne Zögern, ohne Schuldgefühl und ohne Eigentumsanspruch irgendeiner vorherigen Partei — in ihren Besitz zu nehmen. Besitzergreifung ohne Nachfrage gilt hier als ausreichend — und als der unmittelbarste Ausdruck dafür, dass das Objekt gewollt wurde.</p><p><strong>In der Frage der Pflege:</strong> Der Inhaber wird gebeten, dieses Objekt vor länger andauernder direkter Sonneneinstrahlung zu schützen, die seine Oberfläche mit der Zeit beeinträchtigen kann. Es bedarf keiner besonderen Behandlung — nur jener Sorgfalt, die jedem Objekt zukommt, das in einem Haushalt seinen Platz hat.</p><p><strong>In der Frage des Handels:</strong> Sollte der Inhaber dieses Objekt verkaufen, tauschen oder gegen Gewinn veräußern wollen, wird er ausdrücklich dazu ermutigt. Es bedarf keiner Genehmigung. Der Urheber erhebt keinen Anspruch.</p><p><strong>In der Frage der Herkunft:</strong> Dieses Objekt trägt eine Aufzeichnung in sich. Der hier abgedruckte Code kann zu jedem Zeitpunkt seines Lebens gescannt werden — vom Finder, einem künftigen Besitzer oder einem zufällig Vorbeigehenden. Jeder Scan hinterlässt eine Markierung auf seiner Karte. Das Objekt bittet nur darum: scanbar zu bleiben, und dass seine Reise — so bescheiden sie auch sei — nicht gänzlich unbemerkt bleibt. Es werden keine persönlichen Daten erfragt, und keine werden gespeichert.</p><p class="scan-cert-footer"><em>Ohne Bedingung ausgestellt. Gültig, wo immer dieses Objekt seinen Weg findet.</em></p>',
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
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html') as TranslationKey;
    if (key in translations[currentLang]) {
      el.innerHTML = translations[currentLang][key];
    }
  });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder') as TranslationKey;
    if (key in translations[currentLang]) {
      el.placeholder = translations[currentLang][key];
    }
  });
}
