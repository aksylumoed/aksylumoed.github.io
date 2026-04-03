import { API_BASE_URL } from './config';

interface Sighting {
  city: string;
  neighborhood: string;
  lat: number;
  lng: number;
}

const params = new URLSearchParams(window.location.search);
const artworkId = params.get('a') || '';

document.getElementById('artworkId').textContent = `#${artworkId}`;

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
        const city = addr.city || addr.town || addr.village || addr.county || '';
        const neighborhood = addr.suburb || addr.neighbourhood || addr.road || '';
        showConfirm(city, neighborhood, latitude, longitude);
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
  (document.getElementById('cityInput') as HTMLInputElement).focus();
}

function showConfirm(city: string, neighborhood: string, lat: number, lng: number) {
  const locationStr = neighborhood ? `${neighborhood}, ${city}` : city;

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
    await submitSighting({ city, neighborhood, lat, lng });
  });

  confirm.querySelector('.scan-confirm-no').addEventListener('click', () => {
    confirm.remove();
    showManual();
    (document.getElementById('cityInput') as HTMLInputElement).value = city;
    (document.getElementById('neighborhoodInput') as HTMLInputElement).value = neighborhood;
  });
}

submitBtn.addEventListener('click', async () => {
  const city = (document.getElementById('cityInput') as HTMLInputElement).value.trim();
  const neighborhood = (document.getElementById('neighborhoodInput') as HTMLInputElement).value.trim();

  if (!city) {
    scanStatus.textContent = 'city is required.';
    return;
  }

  manualEntry.style.display = 'none';
  await submitSighting({ city, neighborhood, lat: 0, lng: 0 });
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
      body: JSON.stringify({ artworkId, ...sighting }),
    });

    if (res.ok) {
      const locationStr = sighting.neighborhood
        ? `${sighting.neighborhood}, ${sighting.city}`
        : sighting.city;

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
