import OpenSeadragon from 'openseadragon';
import { artworks } from './constants';
import './zoom-prevention';
/// <reference path="openseadragon-extension.d.ts" />

let currentArtworkIndex = 0;
let viewer = null;

document.addEventListener('DOMContentLoaded', () => displayArtwork(currentArtworkIndex));
document.addEventListener('keydown', handleKeyPress);

document.getElementById('initialArtwork').addEventListener('click', function() {
  const initialArtwork = document.getElementById('initialArtwork');
  const info = document.getElementById('infoContainer');
  const homeLink = document.getElementById('homeLink');
  if (initialArtwork) {
    initialArtwork.style.display = 'none'; // Hide the initial artwork image
    info.style.display = 'none';
    homeLink.style.display = 'none'

  }
  displayDzi(currentArtworkIndex); // Call to display artwork in OpenSeadragon
});

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
      const progressElement = document.getElementById('progressText');
      if (progressElement) {
          progressElement.innerHTML = '';
      }
    }
  );
}

function preloadImage(src, callback) {
  const img = new Image();
  img.onload = () => callback(img.src);
  img.src = src;
}


function displayDzi(index: number): void {
  const container = document.getElementById('artworkContainer');

  if (!container || index < 0 || index >= artworks.length) return;

  container.style.display = 'block'; // Make the container visible

  const artwork = artworks[index];
  // Initialize OpenSeadragon viewer
  if (viewer) {
    // Update the tileSource if the viewer already exists
    viewer.open(artwork.dziPath);
  } else {
    viewer = new OpenSeadragon.Viewer({
      id: "artworkContainer",
      prefixUrl: "images/", // Adjust the path to OpenSeadragon images
      tileSources: artwork.dziPath,
      defaultZoomLevel: artwork.minZoomLevel,
      minZoomLevel: artwork.minZoomLevel,
      zoomPerScroll: 1.05,
      zoomPerClick: 1.05,
      showNavigationControl: false,
      visibilityRatio: 1.0,
      // constrainDuringPan: true,
      subPixelRoundingForTransparency: OpenSeadragon.SUBPIXEL_ROUNDING_OCCURRENCES.ALWAYS
    });
  }
}

function loadImageWithProgress(
  url: string,
  onProgress: ProgressCallback,
  onLoad: LoadCallback
): void {
    const xhr = new XMLHttpRequest();
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
    };

    xhr.ontimeout = function() {
      console.error("The request for " + url + " timed out.");
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

