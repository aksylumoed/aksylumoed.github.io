import { getLang, setLang, Lang } from './i18n';

export function initLangSwitcher(containerId: string = 'langSwitcher'): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const lang = getLang();
  container.innerHTML =
    `<span class="lang-option${lang === 'en' ? ' lang-active' : ''}" data-lang="en">EN</span>` +
    `<span class="lang-sep"> | </span>` +
    `<span class="lang-option${lang === 'de' ? ' lang-active' : ''}" data-lang="de">DE</span>`;

  container.querySelectorAll<HTMLElement>('.lang-option').forEach(el => {
    el.addEventListener('click', () => {
      const newLang = el.getAttribute('data-lang') as Lang;
      if (newLang !== getLang()) {
        setLang(newLang);
      }
    });
  });
}
