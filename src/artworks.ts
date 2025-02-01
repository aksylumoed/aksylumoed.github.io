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
  const upButton = document.querySelector('.navigation-button.up') as HTMLElement;
  const downButton = document.querySelector('.navigation-button.down') as HTMLElement;
  if (artwork.subImages && artwork.subImages.length > 1) {
    // If #16 (or any multi-image artwork), show Up/Down
    upButton.style.display = 'inline-block';
    downButton.style.display = 'inline-block';
  } else {
    // Otherwise hide
    upButton.style.display = 'none';
    downButton.style.display = 'none';
  }
  titleElement.textContent = artwork.title;
  descElement.textContent = artwork.description;
  initialArtworkElement.alt = artwork.title;

  // Adjust styles based on the device
  initialArtworkElement.style.maxWidth =
    window.innerWidth <= 780 && artwork.maxWidthPercentageMobile
      ? artwork.maxWidthPercentageMobile
      : artwork.maxWidthPercentage;

  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  // Decide which image path to load
  let imageToLoad: string;
  if (artwork.subImages && artwork.subImages.length > 0) {
    // Make sure subIndex is in range
    if (subIndex < 0) subIndex = 0;
    if (subIndex >= artwork.subImages.length) {
      subIndex = artwork.subImages.length - 1;
    }
    imageToLoad = artwork.subImages[subIndex];
  } else {
    imageToLoad = artwork.imagePath || '';
  }

  loadImageWithProgress(
    imageToLoad,
    (progressText) => {
      const progressElement = document.getElementById('progressText');
      if (progressElement) {
          progressElement.innerHTML = progressText;
      }
    },
    (imgURL) => {
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
  if (direction === 'right') {
    currentArtworkIndex = (currentArtworkIndex + 1) % artworks.length;
  } else if (direction === 'left') {
    currentArtworkIndex = (currentArtworkIndex - 1 + artworks.length) % artworks.length;
  }

  // Update the URL hash without reloading the page
  const newHash = `#/${artworks[currentArtworkIndex].id}`;
  window.location.hash = newHash;

  document.getElementById('artworkContainer').style.display = 'none'; // Hide the viewer
  const initialArtwork = document.getElementById('initialArtwork') as HTMLImageElement;
  if (initialArtwork && initialArtwork.src) {
    initialArtwork.style.display = 'block';
  }
  displayArtwork(currentArtworkIndex);
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
  if (!artwork.subImages) {
    // If no subImages, do nothing
    return;
  }

  // 'up' => subIndex--
  // 'down' => subIndex++
  if (direction === 'up') {
    currentSubIndex--;
    if (currentSubIndex < 0) {
      currentSubIndex = 0; // or wrap around if you want
    }
  } else {
    currentSubIndex++;
    if (currentSubIndex >= artwork.subImages.length) {
      currentSubIndex = artwork.subImages.length - 1; // or wrap around
    }
  }

  updateHashAndDisplay();
}

function updateHashAndDisplay(): void {
  // For the route: #/16/3 means subIndex=2
  // So the subIndex to display in URL is (currentSubIndex+1)
  const artworkId = artworks[currentArtworkIndex].id;
  const newHash = `#/${artworkId}/${(currentSubIndex + 1)}`;
  window.location.hash = newHash;
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
