import OpenSeadragon from 'openseadragon';
import { artworks } from './constants';

let currentArtworkIndex = 0;
let viewer = null;

function displayInitialArtwork(index: number): void {
  const initialArtworkElement = document.getElementById('initialArtwork') as HTMLImageElement;
  const titleElement = document.getElementById('artworkTitle');
  const descElement = document.getElementById('artworkDescription');
  if (!initialArtworkElement || !titleElement || !descElement || index < 0 || index >= artworks.length) return;

  const artwork = artworks[index];
  titleElement.textContent = artwork.title;
  descElement.textContent = artwork.description;
  initialArtworkElement.src = artwork.imagePath;
  initialArtworkElement.alt = artwork.title; // Set appropriate alt text
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
    viewer = OpenSeadragon({
      id: "artworkContainer",
      prefixUrl: "images/", // Adjust the path to OpenSeadragon images
      tileSources: artwork.dziPath,
      defaultZoomLevel: 0.8,
      minZoomLevel: 0.7,
      zoomPerScroll: 1.05,
      zoomPerClick: 1.20,
      showNavigationControl: false
    });
  }

}

export function navigateArtwork(direction: 'left' | 'right'): void {
  if (direction === 'right') {
      currentArtworkIndex = (currentArtworkIndex + 1) % artworks.length;
  } else if (direction === 'left') {
      currentArtworkIndex = (currentArtworkIndex - 1 + artworks.length) % artworks.length;
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

document.getElementById('initialArtwork').addEventListener('click', function() {
  this.style.display = 'none'; // Hide the initial artwork image
  displayArtwork(currentArtworkIndex); // Call to display artwork in OpenSeadragon
});

document.getElementById('closeViewer').addEventListener('click', function() {
  document.getElementById('artworkContainer').style.display = 'none'; // Hide the viewer
  document.getElementById('initialArtwork').style.display = 'block'; // Show the initial artwork image
});

document.addEventListener('DOMContentLoaded', () => {
  const leftButton = document.querySelector('.navigation-button.left');
  const rightButton = document.querySelector('.navigation-button.right');

  if (leftButton) {
    leftButton.addEventListener('click', () => navigateArtwork('left'));
  }
  if (rightButton) {
    rightButton.addEventListener('click', () => navigateArtwork('right'));
  }
});
