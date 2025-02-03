import { artworks } from './constants';
import './prevent-image-actions'

// import OpenSeadragon from 'openseadragon';
// import './prevent-zoom';
/// <reference path="openseadragon-extension.d.ts" />

let currentArtworkIndex = 0;
let viewer = null;
let currentXHR: XMLHttpRequest | null = null;

// track sub-image index when an artwork has multiple images
let currentSubIndex = 0;

// Map from artworkId to the last subIndex displayed
const subIndexMap: { [artworkId: string]: number } = {};

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

document.getElementById('closeViewer').addEventListener('click', function() {
  document.getElementById('artworkContainer').style.display = 'none'; // Hide the viewer
  const initialArtwork = document.getElementById('initialArtwork') as HTMLImageElement;
  const info = document.getElementById('infoContainer');
  const homeLink = document.getElementById('homeLink');
  if (initialArtwork && initialArtwork.src) {
    initialArtwork.style.display = 'block';
    info.style.display = 'block';
    homeLink.style.display = 'block';
  }
});

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

document.getElementById('homeLink').addEventListener('mouseover', function() {
  this.textContent = '○'; // Text to display on hover
});

document.getElementById('homeLink').addEventListener('mouseout', function() {
  this.textContent = '●'; // Original text
});

// Handle browser window resize
window.addEventListener('resize', () => {
  if (viewer) {
    viewer.viewport.resize();
    viewer.viewport.goHome(true);
  }
});

type ProgressCallback = (progressText: string) => void;
type LoadCallback = (imgURL: string) => void;

function displayArtwork(index: number, subIndex: number = 0): void {
  const initialArtworkElement = document.getElementById('initialArtwork') as HTMLImageElement;
  const titleElement = document.getElementById('artworkTitle');
  const descElement = document.getElementById('artworkDescription');
  if (!initialArtworkElement || !titleElement || !descElement) return;
  if (index < 0 || index >= artworks.length) return;

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

  // Load image with progress
  loadImageWithProgress(
    imageToLoad,
    (progressText) => {
      const progressElement = document.getElementById('progressText');
      if (progressElement) {
        progressElement.innerHTML = progressText;
      }
    },
    (imgURL) => {
      // Once loaded, display the image
      initialArtworkElement.src = imgURL;
      initialArtworkElement.style.display = "block";

      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
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

function preloadImage(src, callback) {
  const img = new Image();
  img.onload = () => callback(img.src);
  img.src = src;
}

function loadImageWithProgress(
  url: string,
  onProgress: ProgressCallback,
  onLoad: LoadCallback
): void {
    // Abort any existing request
    if (currentXHR) {
        currentXHR.abort();
        resetProgressText();
    }

    const xhr = new XMLHttpRequest();
    currentXHR = xhr;

    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.timeout = 60000; // Set a longer timeout, if necessary

    xhr.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
            const loaded = (event.loaded / 1024 / 1024).toFixed(2); // Convert bytes to MB
            const total = (event.total / 1024 / 1024).toFixed(2); // Convert bytes to MB
            onProgress(`${loaded}MB / ${total}MB`);
        }
    };

    xhr.onload = function() {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const reader = new FileReader();
            reader.onloadend = () => {
                // Preload the image to render it all at once
                preloadImage(reader.result.toString(), onLoad);
            };
            reader.readAsDataURL(blob);
        }
        // Clear the currentXHR after the request is completed
        currentXHR = null;
    };

    xhr.onerror = function() {
        // Handle error and clear currentXHR
        currentXHR = null;
        resetProgressText();
    };

    xhr.onabort = function() {
        // Handle abort and clear currentXHR
        currentXHR = null;
        resetProgressText();
    };

    xhr.ontimeout = function() {
        console.error("The request for " + url + " timed out.");
        // Clear currentXHR on timeout
        currentXHR = null;
        resetProgressText();
    };

  xhr.send();
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

  // Hide the viewer, show initial
  document.getElementById('artworkContainer').style.display = 'none';
  const initialArtwork = document.getElementById('initialArtwork') as HTMLImageElement;
  if (initialArtwork?.src) {
    initialArtwork.style.display = 'block';
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
