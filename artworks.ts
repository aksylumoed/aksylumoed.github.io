import OpenSeadragon from 'openseadragon';
import { artworks } from './constants';
/// <reference path="openseadragon-extension.d.ts" />

let currentArtworkIndex = 0;
let viewer = null;



function displayInitialArtwork(index: number): void {
  const initialArtworkElement = document.getElementById('initialArtwork') as HTMLImageElement;
  const titleElement = document.getElementById('artworkTitle');
  const descElement = document.getElementById('artworkDescription');
  if (!initialArtworkElement || !titleElement || !descElement || index < 0 || index >= artworks.length) return;
  initialArtworkElement.src = '';

  const loadingIndicator = document.getElementById('loadingIndicator');
  initialArtworkElement.style.display = "none"; // Hide the image initially to prevent showing the old image
  // Show loading indicator
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }


   // Prepare to show the new artwork details
   const artwork = artworks[index];
   titleElement.textContent = artwork.title;
   descElement.textContent = artwork.description;
   initialArtworkElement.alt = artwork.title; // Set appropriate alt text

   // Adjust styles based on the device
   initialArtworkElement.style.maxWidth = window.innerWidth <= 780 && artwork.maxWidthPercentageMobile
                                           ? artwork.maxWidthPercentageMobile
                                           : artwork.maxWidthPercentage;


  // Create a new Image object for loading
  const newImage = new Image();
  newImage.onload = () => {
    initialArtworkElement.src = newImage.src;

    initialArtworkElement.style.display = "block"; // Show the image now that it's loaded and waited for 3 seconds

    // Hide the loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  };

  // Start loading the new image
  newImage.src = artwork.imagePath;
}


function displayArtwork(index: number): void {
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
      defaultZoomLevel: 1.0,
      minZoomLevel: 0.7,
      zoomPerScroll: 1.05,
      zoomPerClick: 1.20,
      showNavigationControl: false,
      subPixelRoundingForTransparency: OpenSeadragon.SUBPIXEL_ROUNDING_OCCURRENCES.ALWAYS
    });
  }
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
  displayInitialArtwork(currentArtworkIndex);
}

// Update the keypress event to use navigateArtwork
function handleKeyPress(event: KeyboardEvent): void {
  if (event.key === 'ArrowRight') {
      navigateArtwork('right');
  } else if (event.key === 'ArrowLeft') {
      navigateArtwork('left');
  }
}

document.addEventListener('DOMContentLoaded', () => displayInitialArtwork(currentArtworkIndex));
document.addEventListener('keydown', handleKeyPress);

document.getElementById('zoom').addEventListener('click', function() {
  const initialArtwork = document.getElementById('initialArtwork');
  const info = document.getElementById('infoContainer');
  if (initialArtwork) {
    initialArtwork.style.display = 'none'; // Hide the initial artwork image
    info.style.display = 'none';
  }
  displayArtwork(currentArtworkIndex); // Call to display artwork in OpenSeadragon
});

document.getElementById('closeViewer').addEventListener('click', function() {
  document.getElementById('artworkContainer').style.display = 'none'; // Hide the viewer
  // Only display the initialArtwork if it has a source set
  const initialArtwork = document.getElementById('initialArtwork') as HTMLImageElement;
  const info = document.getElementById('infoContainer');
  if (initialArtwork && initialArtwork.src) {
    initialArtwork.style.display = 'block';
    info.style.display = 'block';
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
