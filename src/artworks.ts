import { artworks } from './constants';
import './prevent-image-actions'

// import OpenSeadragon from 'openseadragon';
// import './prevent-zoom';
/// <reference path="openseadragon-extension.d.ts" />

let currentArtworkIndex = 0;
let viewer = null;
let currentXHR: XMLHttpRequest | null = null; // Keep track of current XMLHttpRequest

document.addEventListener('DOMContentLoaded', () => displayArtwork(currentArtworkIndex));
document.addEventListener('keydown', handleKeyPress);

document.getElementById('closeViewer').addEventListener('click', function() {
  document.getElementById('artworkContainer').style.display = 'none'; // Hide the viewer
  // Only display the initialArtwork if it has a source set
  const initialArtwork = document.getElementById('initialArtwork') as HTMLImageElement;
  const info = document.getElementById('infoContainer');
  const homeLink = document.getElementById('homeLink');
  if (initialArtwork && initialArtwork.src) {
    initialArtwork.style.display = 'block';
    info.style.display = 'block';
    homeLink.style.display = 'block'
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.body.style.height = window.innerHeight + 'px';
  const leftButton = document.querySelector('.navigation-button.left');
  const rightButton = document.querySelector('.navigation-button.right');

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

function displayArtwork(index: number): void {
  const initialArtworkElement = document.getElementById('initialArtwork') as HTMLImageElement;
  const titleElement = document.getElementById('artworkTitle');
  const descElement = document.getElementById('artworkDescription');
  if (!initialArtworkElement || !titleElement || !descElement || index < 0 || index >= artworks.length) return;

  // Hide the image initially to prevent showing the old image
  initialArtworkElement.src = '';
  initialArtworkElement.style.display = "none";

  // Prepare to show the new artwork details
  const artwork = artworks[index];
  titleElement.textContent = artwork.title;
  descElement.textContent = artwork.description;
  initialArtworkElement.alt = artwork.title; // Set appropriate alt text

  // Adjust styles based on the device
  initialArtworkElement.style.maxWidth = window.innerWidth <= 780 && artwork.maxWidthPercentageMobile
  ? artwork.maxWidthPercentageMobile
  : artwork.maxWidthPercentage;

  // Show loading indicator
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  loadImageWithProgress(artwork.imagePath,
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
      // Reset progress text for next load
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
    };

    xhr.send();
}

export function navigateArtwork(direction: 'left' | 'right'): void {
  if (direction === 'right') {
      currentArtworkIndex = (currentArtworkIndex + 1) % artworks.length;
  } else if (direction === 'left') {
      currentArtworkIndex = (currentArtworkIndex - 1 + artworks.length) % artworks.length;
  }

  document.getElementById('artworkContainer').style.display = 'none'; // Hide the viewer
  // Only display the initialArtwork if it has a source set
  const initialArtwork = document.getElementById('initialArtwork') as HTMLImageElement;
  if (initialArtwork && initialArtwork.src) {
    initialArtwork.style.display = 'block';
  }
  displayArtwork(currentArtworkIndex);
}

// Update the keypress event to use navigateArtwork
function handleKeyPress(event: KeyboardEvent): void {
  if (event.key === 'ArrowRight') {
      navigateArtwork('right');
  } else if (event.key === 'ArrowLeft') {
      navigateArtwork('left');
  }
}
