export type ProgressCallback = (progressText: string) => void;
export type LoadCallback = (imgURL: string) => void;

function preloadImage(src: string, callback: LoadCallback): void {
  const img = new Image();
  img.onload = () => callback(img.src);
  img.src = src;
}

export function loadImageWithProgress(
  url: string,
  onProgress: ProgressCallback,
  onLoad: LoadCallback,
  onFail?: () => void
): XMLHttpRequest {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.timeout = 60000;

  xhr.onprogress = (event: ProgressEvent) => {
    if (event.lengthComputable) {
      const loaded = (event.loaded / 1024 / 1024).toFixed(2);
      const total = (event.total / 1024 / 1024).toFixed(2);
      onProgress(`${loaded}MB / ${total}MB`);
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200) {
      const blob = xhr.response;
      const reader = new FileReader();
      reader.onloadend = () => {
        preloadImage(reader.result.toString(), onLoad);
      };
      reader.readAsDataURL(blob);
    }
  };

  xhr.onerror = function () { if (onFail) onFail(); };
  xhr.onabort = function () { if (onFail) onFail(); };
  xhr.ontimeout = function () {
    console.error('Image request timed out: ' + url);
    if (onFail) onFail();
  };

  xhr.send();
  return xhr;
}
