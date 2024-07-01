
// Function to reset the zoom level
function resetZoom() {
  document.body.style.transform = 'scale(1)';
  document.body.style.transformOrigin = '0 0';
}

// Listen for the window resize event and reset the zoom level
window.addEventListener('resize', resetZoom);

// Listen for the wheel event with the Ctrl key pressed and prevent the default action
window.addEventListener('wheel', function(event) {
  if (event.ctrlKey) {
    event.preventDefault();
    resetZoom();
  }
}, { passive: false });

// Prevent zooming with touch gestures
document.addEventListener('touchstart', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

document.addEventListener('gesturestart', function(event) {
  event.preventDefault();
});

document.addEventListener('gesturechange', function(event) {
  event.preventDefault();
});

document.addEventListener('gestureend', function(event) {
  event.preventDefault();
});

// Prevent zooming with keyboard shortcuts
window.addEventListener('keydown', function(event) {
  if ((event.ctrlKey || event.metaKey) && (event.key === '=' || event.key === '-' || event.key === '0')) {
    event.preventDefault();
    resetZoom();
  }
});

// Initial zoom reset
resetZoom();
