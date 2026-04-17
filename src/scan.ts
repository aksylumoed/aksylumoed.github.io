import Typed from 'typed.js';
import { API_BASE_URL } from './config';
import { artworks } from './constants';
import { t, applyDataI18n, onLangChange, getLang, setLang, Lang } from './i18n';
import { loadImageWithProgress } from './image-loader';

interface Sighting {
  city: string;
  neighborhood: string;
  postcode: string;
  lat: number;
  lng: number;
}

const params = new URLSearchParams(window.location.search);
const artworkId = params.get('a') || '';
const subIndexParam = params.get('s');

const artwork = artworks.find(a => a.id === artworkId);

function resolveImagePath(): string | null {
  if (!artwork) return null;

  if (artwork.subImages && artwork.subImages.length > 0 && !artwork.imagePath) {
    if (!subIndexParam) return null;
    const subIndex = parseInt(subIndexParam, 10) - 1;
    if (isNaN(subIndex) || subIndex < 0 || subIndex >= artwork.subImages.length) return null;
    return artwork.subImages[subIndex].path;
  }

  return artwork.imagePath ?? null;
}

const imgPath = resolveImagePath();

if (!artwork || imgPath === null) {
  const phaseCert = document.getElementById('phase-certificate') as HTMLDivElement;
  const phaseSighting = document.getElementById('phase-sighting') as HTMLDivElement;
  phaseCert.style.display = 'none';
  phaseSighting.style.display = 'block';
  document.querySelector<HTMLElement>('.scan-container').innerHTML = `
    <a href="/" class="scan-home">adndkr</a>
    <div class="scan-404">
      <div class="scan-404-code">404</div>
      <div class="scan-404-msg">${t('artwork_not_found')}</div>
    </div>
  `;
} else {
  applyDataI18n();
  initLangColumn();

  let scanTyped: Typed | null = null;
  let scanTypingComplete = false;
  let scanPendingImageURL: string | null = null;

  const scanLoadingIndicator = document.getElementById('scanLoadingIndicator') as HTMLDivElement;
  const scanProgressEl = document.getElementById('scanProgressText') as HTMLDivElement;

  function revealScanImage(imgURL: string): void {
    if (scanTyped) { scanTyped.destroy(); scanTyped = null; }
    scanLoadingIndicator.style.display = 'none';
    const previewImg = document.getElementById('artworkPreview') as HTMLImageElement;
    previewImg.src = imgURL;
    previewImg.style.display = 'block';
  }

  // Start the XHR immediately so the image preloads during certificate reading.
  // The Typed animation is deferred until the sighting phase is visible.
  loadImageWithProgress(
    imgPath,
    (progressText) => {
      if (!scanTypingComplete) return;
      scanProgressEl.textContent = progressText;
    },
    (imgURL) => {
      if (scanTypingComplete) {
        revealScanImage(imgURL);
      } else {
        scanPendingImageURL = imgURL;
      }
    },
    () => {
      if (scanTyped) { scanTyped.destroy(); scanTyped = null; }
      scanLoadingIndicator.style.display = 'none';
    }
  );

  initSightingPhase();

  document.getElementById('acknowledgeBtn').addEventListener('click', () => {
    (document.getElementById('phase-certificate') as HTMLDivElement).style.display = 'none';
    (document.getElementById('phase-sighting') as HTMLDivElement).style.display = 'block';
    window.scrollTo(0, 0);

    // Show the loading indicator and start typing now that the element is visible.
    // If the image already loaded, pendingImageURL will be revealed in onComplete.
    scanLoadingIndicator.style.display = 'block';
    scanProgressEl.textContent = '';
    const fetchingEl = document.getElementById('scanFetchingText') as HTMLDivElement;
    fetchingEl.textContent = '';
    scanTyped = new Typed('#scanFetchingText', {
      strings: [t('fetching')],
      typeSpeed: 25,
      loop: false,
      showCursor: false,
      onComplete: () => {
        scanTypingComplete = true;
        if (scanPendingImageURL) {
          revealScanImage(scanPendingImageURL);
          scanPendingImageURL = null;
        }
      },
    });
  });
}

function initLangColumn() {
  const column = document.getElementById('certLangColumn');
  if (!column) return;

  function updateActive() {
    const lang = getLang();
    column.querySelectorAll<HTMLElement>('.lang-option').forEach(el => {
      el.classList.toggle('lang-active', el.dataset.lang === lang);
    });
  }

  updateActive();
  onLangChange(updateActive);

  column.querySelectorAll<HTMLElement>('.lang-option').forEach(el => {
    el.addEventListener('click', () => {
      const newLang = el.dataset.lang as Lang;
      if (newLang !== getLang()) {
        setLang(newLang);
      }
    });
  });
}

function initSightingPhase() {
  onLangChange(() => applyDataI18n());

  document.getElementById('backBtn').addEventListener('click', () => {
    (document.getElementById('phase-sighting') as HTMLDivElement).style.display = 'none';
    (document.getElementById('phase-certificate') as HTMLDivElement).style.display = 'block';
    window.scrollTo(0, 0);
  });

  const artworkIdEl = document.getElementById('artworkId') as HTMLAnchorElement;
  artworkIdEl.textContent = artwork.title;
  const objectsHash = subIndexParam ? `#/${artworkId}/${subIndexParam}` : `#/${artworkId}`;
  artworkIdEl.href = `/objects/${objectsHash}`;

  const locateBtn = document.getElementById('locateBtn') as HTMLButtonElement;
  const manualToggle = document.getElementById('manualToggle') as HTMLButtonElement;
  const manualEntry = document.getElementById('manualEntry') as HTMLDivElement;
  const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
  const scanStatus = document.getElementById('scanStatus') as HTMLDivElement;

  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showManual();
      return;
    }

    locateBtn.textContent = t('locating');
    locateBtn.disabled = true;
    manualToggle.style.display = 'none';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
          const road = addr.road ? `${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}` : '';
          const neighborhood = road || addr.quarter || addr.suburb || addr.city_district || '';
          const postcode = addr.postcode || '';
          showConfirm(city, neighborhood, postcode, latitude, longitude);
        } catch {
          showManual();
        }
      },
      () => {
        showManual();
      },
      { timeout: 10000 }
    );
  });

  manualToggle.addEventListener('click', showManual);

  function showManual() {
    locateBtn.style.display = 'none';
    manualToggle.style.display = 'none';
    manualEntry.style.display = 'flex';
    (document.getElementById('neighborhoodInput') as HTMLInputElement).focus();
  }

  function showConfirm(city: string, neighborhood: string, postcode: string, lat: number, lng: number) {
    const postcodeCity = postcode ? `${postcode} ${city}` : city;
    const locationStr = neighborhood ? `${neighborhood}, ${postcodeCity}` : postcodeCity;

    locateBtn.style.display = 'none';
    manualToggle.style.display = 'none';

    const confirm = document.createElement('div');
    confirm.className = 'scan-confirm';
    confirm.innerHTML = `
      <div class="scan-confirm-location">
        <span data-i18n="found_at">${t('found_at')}</span>
        ${locationStr || 'unknown location'}
      </div>
      <div class="scan-confirm-btns">
        <button class="scan-confirm-yes" data-i18n="confirm">${t('confirm')}</button>
        <button class="scan-confirm-no" data-i18n="edit">${t('edit')}</button>
      </div>
    `;

    scanStatus.parentNode.insertBefore(confirm, scanStatus);

    confirm.querySelector('.scan-confirm-yes').addEventListener('click', async () => {
      confirm.remove();
      await submitSighting({ city, neighborhood, postcode, lat, lng });
    });

    confirm.querySelector('.scan-confirm-no').addEventListener('click', () => {
      confirm.remove();
      showManual();
      (document.getElementById('cityInput') as HTMLInputElement).value = city;
      (document.getElementById('neighborhoodInput') as HTMLInputElement).value = neighborhood;
      (document.getElementById('postcodeInput') as HTMLInputElement).value = postcode;
    });
  }

  submitBtn.addEventListener('click', async () => {
    const city = (document.getElementById('cityInput') as HTMLInputElement).value.trim();
    const neighborhood = (document.getElementById('neighborhoodInput') as HTMLInputElement).value.trim();
    const postcode = (document.getElementById('postcodeInput') as HTMLInputElement).value.trim();

    if (!city) {
      scanStatus.textContent = t('city_required');
      return;
    }

    manualEntry.style.display = 'none';
    await submitSighting({ city, neighborhood, postcode, lat: 0, lng: 0 });
  });

  async function submitSighting(sighting: Sighting) {
    scanStatus.textContent = t('logging');

    if (API_BASE_URL === 'YOUR_API_GATEWAY_URL') {
      scanStatus.textContent = t('api_not_configured');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/sighting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId, city: sighting.city, neighborhood: sighting.neighborhood, postcode: sighting.postcode, lat: sighting.lat, lng: sighting.lng }),
      });

      if (res.ok) {
        const postcodeCity = sighting.postcode ? `${sighting.postcode} ${sighting.city}` : sighting.city;
        const locationStr = sighting.neighborhood
          ? `${sighting.neighborhood}, ${postcodeCity}`
          : postcodeCity;
        const objectsHash = subIndexParam ? `#/${artworkId}/${subIndexParam}` : `#/${artworkId}`;

        document.querySelector('.scan-container').innerHTML = `
          <a href="/" class="scan-home">●</a>
          <div class="scan-done-state">
            <div class="scan-done-label"><span class="scan-done-dot">●</span> ${t('logged')}</div>
            <div class="scan-done-location">${locationStr}</div>
            <div class="scan-done-links">
              <a href="/objects/${objectsHash}" class="scan-done-link">${t('view_object_record')}</a>
              <a href="https://www.instagram.com/adndkr" class="scan-done-link">${t('contact')}</a>
            </div>
          </div>
        `;
      } else {
        scanStatus.textContent = t('something_wrong');
      }
    } catch {
      scanStatus.textContent = t('network_error');
    }
  }
}
