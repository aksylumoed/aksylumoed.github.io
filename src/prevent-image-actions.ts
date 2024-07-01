
// Function to disable right-click on images
function disableRightClickOnImages() {
  document.addEventListener('contextmenu', function(event) {
      if (event.target instanceof HTMLImageElement) {
          event.preventDefault();
      }
  });
}

// Function to disable dragging of images
function disableImageDragging() {
  const images = document.getElementsByTagName('img');
  for (const img of images) {
      img.ondragstart = function() { return false; };
  }
}

disableRightClickOnImages();
disableImageDragging();
