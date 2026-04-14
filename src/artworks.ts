import { artworks } from './constants';
import { API_BASE_URL } from './config';
import './prevent-image-actions'
import { loadImageWithProgress } from './image-loader';

let currentArtworkIndex = 0;
let currentXHR: XMLHttpRequest | null = null;

// track sub-image index when an artwork has multiple images
let currentSubIndex = 0;

// Map from artworkId to the last subIndex displayed
const subIndexMap: { [artworkId: string]: number } = {};

document.addEventListener('DOMContentLoaded', () => {
  const deploymentStatus = document.getElementById('deploymentStatus');
  const trajectoryPanel = document.getElementById('trajectoryPanel');
  const trajectoryContent = document.getElementById('trajectoryContent');

  deploymentStatus.addEventListener('click', (e) => {
    if (deploymentStatus.classList.contains('not-deployed')) return;
    e.stopPropagation();
    const wasOpen = trajectoryPanel.classList.contains('open');
    trajectoryPanel.classList.toggle('open');
    if (wasOpen) collapseAllGroups(trajectoryContent);
  });

  document.addEventListener('click', () => {
    if (trajectoryPanel.classList.contains('open')) collapseAllGroups(trajectoryContent);
    trajectoryPanel.classList.remove('open');
  });

  trajectoryContent.addEventListener('click', (e) => {
    const header = (e.target as Element).closest('.trajectory-group-header');
    if (!header) return;
    e.stopPropagation();
    header.closest('.trajectory-group').classList.toggle('expanded');
    updateTrajectoryFades(trajectoryContent);
  });

  trajectoryContent.addEventListener('scroll', () => updateTrajectoryFades(trajectoryContent));
});

document.addEventListener('DOMContentLoaded', () => {
  let artworkId = artworks[0].id;
  const hash = window.location.hash.substring(1); // remove '#'
  const pathParts = hash.split('/').filter(Boolean);

  if (pathParts.length >= 1) {
    artworkId = pathParts[0];
  }

  const index = artworks.findIndex(artwork => artwork.id === artworkId);

  if (index !== -1) {
    currentArtworkIndex = index;
  } else {
    currentArtworkIndex = 0;
  }

  if (pathParts.length >= 2) {
    currentSubIndex = parseInt(pathParts[1], 10) - 1; // e.g. "#/16/2" => subIndex = 1
    if (isNaN(currentSubIndex)) currentSubIndex = 0;
  } else {
    currentSubIndex = 0;
  }

  displayArtwork(currentArtworkIndex, currentSubIndex);
});

document.addEventListener('keydown', handleKeyPress);


document.addEventListener('DOMContentLoaded', () => {
  document.body.style.height = window.innerHeight + 'px';
  const upButton = document.querySelector('.navigation-button.up');
  const downButton = document.querySelector('.navigation-button.down');
  const leftButton = document.querySelector('.navigation-button.left');
  const rightButton = document.querySelector('.navigation-button.right');

  if (upButton) {
    upButton.addEventListener('click', () => navigateSubImage('up'));
  }
  if (downButton) {
    downButton.addEventListener('click', () => navigateSubImage('down'));
  }
  if (leftButton) {
    leftButton.addEventListener('click', () => navigateArtwork('left'));
  }
  if (rightButton) {
    rightButton.addEventListener('click', () => navigateArtwork('right'));
  }
});



function displayArtwork(index: number, subIndex: number = 0): void {
  const initialArtworkElement = document.getElementById('initialArtwork') as HTMLImageElement;
  const titleElement = document.getElementById('artworkTitle');
  const descElement = document.getElementById('artworkDescription');
  const deploymentStatusEl = document.getElementById('deploymentStatus');
  if (!initialArtworkElement || !titleElement || !descElement) return;
  if (index < 0 || index >= artworks.length) return;

  deploymentStatusEl.classList.add('status-hidden');

  // Hide old image
  initialArtworkElement.src = '';
  initialArtworkElement.style.display = "none";

  const artwork = artworks[index];

  // Show or hide Up/Down buttons depending on subImages
  const upButton = document.querySelector('.navigation-button.up') as HTMLElement;
  const downButton = document.querySelector('.navigation-button.down') as HTMLElement;
  if (artwork.subImages && artwork.subImages.length > 0) {
    upButton.style.visibility = 'visible';
    downButton.style.visibility = 'visible';
  } else {
    upButton.style.visibility = 'hidden';
    downButton.style.visibility = 'hidden';
  }

  // Set title, desc, and alt
  titleElement.textContent = artwork.title;
  descElement.textContent = artwork.description;
  initialArtworkElement.alt = artwork.title;

  const trackingId = (artwork.subImages && artwork.subImages.length > 0)
    ? `${artwork.id}-${subIndex + 1}`
    : artwork.id;
  updateDeploymentStatus(trackingId);

  // Decide which image path + width settings to load
  let imageToLoad: string;
  // Start with artwork's default widths
  let maxWidthDesktop = artwork.maxWidthPercentage;
  let maxWidthMobile = artwork.maxWidthPercentageMobile;

  if (artwork.subImages && artwork.subImages.length > 0) {
    // Make sure subIndex is valid
    if (subIndex < 0) subIndex = 0;
    if (subIndex >= artwork.subImages.length) {
      subIndex = artwork.subImages.length - 1;
    }
    // Pick the sub-image
    const subImage = artwork.subImages[subIndex];
    imageToLoad = subImage.path;

    // If subImage provides specific maxWidth overrides, use them
    if (subImage.maxWidthPercentage) {
      maxWidthDesktop = subImage.maxWidthPercentage;
    }
    if (subImage.maxWidthPercentageMobile) {
      maxWidthMobile = subImage.maxWidthPercentageMobile;
    }

    // store the latest accessed subIndex for this artwork
    subIndexMap[artwork.id] = subIndex;
  } else {
    // Single image fallback
    imageToLoad = artwork.imagePath || '';
  }

  // Adjust styles based on device
  if (window.innerWidth <= 780) {
    initialArtworkElement.style.maxWidth = maxWidthMobile;
  } else {
    initialArtworkElement.style.maxWidth = maxWidthDesktop;
  }

  // Show loading indicator
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  // Abort any in-flight request before starting a new one
  if (currentXHR) {
    currentXHR.abort();
    resetProgressText();
  }

  currentXHR = loadImageWithProgress(
    imageToLoad,
    (progressText) => {
      const progressElement = document.getElementById('progressText');
      if (progressElement) {
        progressElement.innerHTML = progressText;
      }
    },
    (imgURL) => {
      currentXHR = null;
      initialArtworkElement.src = imgURL;
      initialArtworkElement.style.display = "block";

      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      resetProgressText();
      deploymentStatusEl.classList.remove('status-hidden');
    },
    () => {
      currentXHR = null;
      resetProgressText();
    }
  );
}

function resetProgressText() {
  const progressElement = document.getElementById('progressText');
  if (progressElement) {
    progressElement.innerHTML = '';
  }
}

export function navigateArtwork(direction: 'left' | 'right'): void {
  const oldArtwork = artworks[currentArtworkIndex];
  // If old artwork has subImages, remember subIndex
  if (oldArtwork.subImages && oldArtwork.subImages.length > 0) {
    subIndexMap[oldArtwork.id] = currentSubIndex;
  }

  // Move left or right
  if (direction === 'right') {
    currentArtworkIndex = (currentArtworkIndex + 1) % artworks.length;
  } else {
    currentArtworkIndex = (currentArtworkIndex - 1 + artworks.length) % artworks.length;
  }

  // Figure out if the new artwork has subImages
  const newArtwork = artworks[currentArtworkIndex];
  if (newArtwork.subImages && newArtwork.subImages.length > 0) {
    // Sub-images exist => retrieve from map (or default = 0)
    currentSubIndex = subIndexMap[newArtwork.id] ?? 0;
    window.location.hash = `#/${newArtwork.id}/${currentSubIndex + 1}`;
    displayArtwork(currentArtworkIndex, currentSubIndex);
  } else {
    // No sub-images => skip subIndex altogether
    currentSubIndex = 0;
    window.location.hash = `#/${newArtwork.id}`;
    displayArtwork(currentArtworkIndex);
  }
}

// Update the keypress event to use navigateArtwork
function handleKeyPress(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowRight':
      navigateArtwork('right');
      break;
    case 'ArrowLeft':
      navigateArtwork('left');
      break;
    case 'ArrowUp':
      navigateSubImage('up');
      break;
    case 'ArrowDown':
      navigateSubImage('down');
      break;
  }
}

function navigateSubImage(direction: 'up' | 'down'): void {
  const artwork = artworks[currentArtworkIndex];
  if (!artwork.subImages || artwork.subImages.length === 0) {
    return; // No sub-images => do nothing
  }

  // Move currentSubIndex up/down
  if (direction === 'up') {
    currentSubIndex--;
    if (currentSubIndex < 0) {
      currentSubIndex = artwork.subImages.length - 1;
    }
  } else {
    currentSubIndex++;
    if (currentSubIndex >= artwork.subImages.length) {
      currentSubIndex = 0;
    }
  }

  // Store the new subIndex for this artwork
  subIndexMap[artwork.id] = currentSubIndex;
  updateHashAndDisplay();
}

function updateHashAndDisplay(): void {
  const artwork = artworks[currentArtworkIndex];
  // If subImages exist, update hash with subIndex
  window.location.hash = `#/${artwork.id}/${(currentSubIndex + 1)}`;
  displayArtwork(currentArtworkIndex, currentSubIndex);
}

// Handle browser back and forward navigation
window.addEventListener('hashchange', () => {
  let artworkId = artworks[0].id;
  const hash = window.location.hash.substring(1);
  const pathParts = hash.split('/').filter(Boolean);

  if (pathParts.length >= 1) {
    artworkId = pathParts[0];
  }
  const index = artworks.findIndex(artwork => artwork.id === artworkId);
  if (index !== -1) {
    currentArtworkIndex = index;
  } else {
    currentArtworkIndex = 0;
  }

  // NEW: also parse subIndex
  if (pathParts.length >= 2) {
    currentSubIndex = parseInt(pathParts[1], 10) - 1;
    if (isNaN(currentSubIndex)) currentSubIndex = 0;
  } else {
    currentSubIndex = 0;
  }

  displayArtwork(currentArtworkIndex, currentSubIndex);
});

// ── Trajectory / deployment status ──────────────────────────────────────────

interface Sighting {
  timestamp: number;
  city: string;
  neighborhood: string;
  postcode: string;
}

async function updateDeploymentStatus(artworkId: string): Promise<void> {
  const statusDot = document.getElementById('statusDot');
  const statusLabel = document.getElementById('statusLabel');
  const deploymentStatus = document.getElementById('deploymentStatus');
  const trajectoryPanel = document.getElementById('trajectoryPanel');
  const trajectoryContent = document.getElementById('trajectoryContent');

  trajectoryPanel.classList.remove('open');
  statusDot.className = 'status-dot status-loading';
  statusLabel.textContent = '';

  const setNotDeployed = () => {
    statusDot.className = 'status-dot status-studio';
    statusLabel.textContent = 'not deployed';
    deploymentStatus.classList.add('not-deployed');
    trajectoryContent.innerHTML = '';
    trajectoryContent.classList.remove('has-top', 'has-bottom');
  };

  const setDeployed = (sightings: Sighting[]) => {
    deploymentStatus.classList.remove('not-deployed');
    statusDot.className = sightings.length === 1
      ? 'status-dot status-deployed-new'
      : 'status-dot status-deployed';
    statusLabel.textContent = 'deployed';
    trajectoryContent.innerHTML = renderSightings(sightings);
    updateTrajectoryFades(trajectoryContent);
  };

  try {
    const res = await fetch(`${API_BASE_URL}/sightings?artworkId=${encodeURIComponent(artworkId)}`);
    const data = await res.json();
    const sightings: Sighting[] = data.sightings || [];

    if (sightings.length === 0) {
      setNotDeployed();
    } else {
      setDeployed(sightings);
    }
  } catch {
    setNotDeployed();
  }
}

function updateTrajectoryFades(el: HTMLElement): void {
  el.classList.toggle('has-top', el.scrollTop > 0);
  el.classList.toggle('has-bottom', el.scrollTop + el.clientHeight < el.scrollHeight - 1);
}

function formatSightingDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
}

function formatLocation(s: Sighting): string {
  const postcodeCity = s.postcode ? `${s.postcode} ${s.city}` : s.city;
  return s.neighborhood ? `${s.neighborhood}, ${postcodeCity}` : postcodeCity;
}

function groupSightings(sightings: Sighting[]): Array<{ location: string; entries: Sighting[] }> {
  const groups: Map<string, { location: string; entries: Sighting[] }> = new Map();
  for (const s of sightings) {
    const key = `${s.neighborhood || ''}|${s.postcode || ''}|${s.city || ''}`;
    if (!groups.has(key)) groups.set(key, { location: formatLocation(s), entries: [] });
    groups.get(key)!.entries.push(s);
  }
  return Array.from(groups.values());
}

function collapseAllGroups(container: HTMLElement): void {
  container.querySelectorAll('.trajectory-group.expanded').forEach(g => g.classList.remove('expanded'));
}

function renderSightings(sightings: Sighting[]): string {
  const groups = groupSightings(sightings);
  return groups.map((group, gi) => {
    const isOrigin = gi === groups.length - 1;
    const originTag = isOrigin ? `&nbsp;&nbsp;<span class="origin-tag">[origin]</span>` : '';
    const sep = gi < groups.length - 1 ? '<div class="trajectory-sep"></div>' : '';

    if (group.entries.length === 1) {
      const dateStr = formatSightingDate(group.entries[0].timestamp);
      return `<div class="trajectory-entry${isOrigin ? ' trajectory-origin' : ''}">  ${dateStr}&nbsp;&nbsp;${group.location}${originTag}</div>${sep}`;
    }

    const newestDate = formatSightingDate(group.entries[0].timestamp);
    const countBadge = `<span class="trajectory-count">${group.entries.length}</span>`;
    const innerEntries = group.entries.map((s, ei) => {
      const dateStr = formatSightingDate(s.timestamp);
      const innerSep = ei < group.entries.length - 1 ? '<div class="trajectory-sep"></div>' : '';
      return `<div class="trajectory-entry trajectory-subentry">  ${dateStr}&nbsp;&nbsp;${group.location}</div>${innerSep}`;
    }).join('');

    return `<div class="trajectory-group">` +
      `<div class="trajectory-group-header trajectory-entry${isOrigin ? ' trajectory-origin' : ''}">  ${newestDate}&nbsp;&nbsp;${group.location}${originTag}&nbsp;&nbsp;${countBadge}</div>` +
      `<div class="trajectory-group-entries">${innerEntries}</div>` +
      `</div>${sep}`;
  }).join('');
}
