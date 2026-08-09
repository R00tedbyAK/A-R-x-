// --- Word List & Room ID Generator ---
const roomWords = [
  'cat', 'touch', 'nano', 'ghost', 'alpha', 'pulse', 'orbit', 'sonic', 'drift'
];

function generateHandle() {
  const randomWord = roomWords[Math.floor(Math.random() * roomWords.length)];
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${randomWord}${randomNumber}`;
}

// --- App State ---
let currentRoom = '';
let qrcodeInstance = null;

// --- DOM Elements ---
const roomInput = document.getElementById('roomInput');
const goRoomBtn = document.getElementById('goRoomBtn');
const newRoomBtn = document.getElementById('newRoomBtn');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

const emptyState = document.getElementById('emptyState');
const imageDisplayContainer = document.getElementById('imageDisplayContainer');
const imageDisplay = document.getElementById('imageDisplay');

const btnCopy = document.getElementById('btnCopy');
const btnRefresh = document.getElementById('btnRefresh');
const btnSave = document.getElementById('btnSave');
const btnClear = document.getElementById('btnClear');
const copyUrlBtn = document.getElementById('copyUrlBtn');

// --- Canvas Image Converter for Clipboard API ---
function getCanvasPngBlob(imgElement) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);

      // Force output to PNG Blob
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob generation failed'));
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

// --- QR Code & Navigation ---
function updateQRCode(url) {
  const qrContainer = document.getElementById('qrcode');
  if (!qrContainer) return;
  
  qrContainer.innerHTML = '';
  qrcodeInstance = new QRCode(qrContainer, {
    text: url,
    width: 140,
    height: 140,
    colorDark: "#0f172a",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

function loadRoomData(roomId) {
  const savedImage = localStorage.getItem(`airx_room_${roomId}`);
  if (savedImage) {
    renderImage(savedImage);
  } else {
    clearDisplay();
  }
}

function setRoom(roomId) {
  currentRoom = roomId;
  window.location.hash = roomId;
  if (roomInput) roomInput.value = roomId;
  updateQRCode(window.location.href);
  loadRoomData(roomId);
}

function initRoom() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    setRoom(hash);
  } else {
    setRoom(generateHandle());
  }
}

// --- Image Processing & Display ---
function renderImage(dataUrl) {
  imageDisplay.src = dataUrl;
  if (emptyState) emptyState.classList.add('hidden');
  if (imageDisplayContainer) imageDisplayContainer.classList.remove('hidden');
}

function clearDisplay() {
  imageDisplay.src = '';
  if (emptyState) emptyState.classList.remove('hidden');
  if (imageDisplayContainer) imageDisplayContainer.classList.add('hidden');
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert("Please select or paste a valid image file.");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => renderImage(e.target.result);
  reader.readAsDataURL(file);
}

// --- Fixed Copy Action ---
if (btnCopy) {
  btnCopy.addEventListener('click', async () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      alert("No image available to copy!");
      return;
    }

    try {
      // 1. Convert any image format (JPEG, WebP, Base64) to PNG Blob via Canvas
      const pngBlob = await getCanvasPngBlob(imageDisplay);

      // 2. Write to system clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);

      const originalText = btnCopy.textContent;
      btnCopy.textContent = '✅ Copied!';
      setTimeout(() => { btnCopy.textContent = originalText; }, 2000);
    } catch (err) {
      console.error('Clipboard Error:', err);

      if (!window.isSecureContext) {
        alert("Copying images directly requires a secure context (HTTPS or http://localhost). If opening locally, use VS Code Live Server.");
      } else {
        alert("Copy failed. Try right-clicking the image and selecting 'Copy Image'.");
      }
    }
  });
}

// --- Save Action (Saves to Room Storage) ---
if (btnSave) {
  btnSave.addEventListener('click', () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      alert("No image available to save!");
      return;
    }

    try {
      localStorage.setItem(`airx_room_${currentRoom}`, imageDisplay.src);
      const originalText = btnSave.textContent;
      btnSave.textContent = '✅ Saved to Room!';
      setTimeout(() => { btnSave.textContent = originalText; }, 2000);
    } catch (err) {
      console.error('Room save error:', err);
      alert("Failed to save image to room storage. The image may exceed browser storage limits.");
    }
  });
}

// --- Refresh Action ---
if (btnRefresh) {
  btnRefresh.addEventListener('click', () => {
    const originalText = btnRefresh.textContent;
    btnRefresh.textContent = 'Syncing...';
    loadRoomData(currentRoom);
    setTimeout(() => { btnRefresh.textContent = originalText; }, 1000);
  });
}

// --- Clear Action (Clears Display & Room Storage) ---
if (btnClear) {
  btnClear.addEventListener('click', () => {
    localStorage.removeItem(`airx_room_${currentRoom}`);
    clearDisplay();
  });
}

// --- Global Paste & Drag Drop Event Listeners ---
window.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      handleFile(blob);
      break;
    }
  }
});

if (dropZone) {
  dropZone.addEventListener('click', () => fileInput && fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });
}

if (goRoomBtn) {
  goRoomBtn.addEventListener('click', () => {
    const value = roomInput.value.trim();
    if (value) setRoom(value);
  });
}

if (newRoomBtn) {
  newRoomBtn.addEventListener('click', () => {
    setRoom(generateHandle());
  });
}

if (copyUrlBtn) {
  copyUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    const originalText = copyUrlBtn.textContent;
    copyUrlBtn.textContent = 'Link Copied!';
    setTimeout(() => { copyUrlBtn.textContent = originalText; }, 2000);
  });
}

initRoom();
