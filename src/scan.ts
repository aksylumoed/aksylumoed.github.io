import { API_BASE_URL } from './config';
import { artworks } from './constants';

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

function show404() {
  document.querySelector('.scan-container').innerHTML = `
    <a href="/" class="scan-home">adndkr</a>
    <div class="scan-404">
      <div class="scan-404-code">404</div>
      <div class="scan-404-msg">artwork not found.</div>
    </div>
  `;
}

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
  show404();
} else {
  init(imgPath);
}

function init(resolvedImgPath: string) {
  const artworkIdDisplay = artworkId.replace('-', '.');
  document.getElementById('artworkId').textContent = `#${artworkIdDisplay}`;

  const previewImg = document.getElementById('artworkPreview') as HTMLImageElement;
  previewImg.src = resolvedImgPath;
  previewImg.style.display = 'block';

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

    locateBtn.textContent = 'locating...';
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
        <span>found at</span>
        ${locationStr || 'unknown location'}
      </div>
      <div class="scan-confirm-btns">
        <button class="scan-confirm-yes">confirm</button>
        <button class="scan-confirm-no">edit</button>
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
      scanStatus.textContent = 'city is required.';
      return;
    }

    manualEntry.style.display = 'none';
    await submitSighting({ city, neighborhood, postcode, lat: 0, lng: 0 });
  });

  async function submitSighting(sighting: Sighting) {
    scanStatus.textContent = 'logging...';

    if (API_BASE_URL === 'YOUR_API_GATEWAY_URL') {
      scanStatus.textContent = 'api not configured.';
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

        document.querySelector('.scan-container').innerHTML = `
          <a href="/" class="scan-home">adndkr</a>
          <div class="scan-done-state">
            <div class="scan-done-label">● logged.</div>
            <div class="scan-done-location">${locationStr}</div>
          </div>
        `;
      } else {
        scanStatus.textContent = 'something went wrong. try again.';
      }
    } catch {
      scanStatus.textContent = 'network error. try again.';
    }
  }
}
