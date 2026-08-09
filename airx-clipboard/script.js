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

// --- Helper: Canvas Conversion for Clipboard API ---
function getCanvasPngBlob(imgElement) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob generation failed'));
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

// --- QR Code & Room Sync ---
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

// Fetch image payload from Backend API for currentRoom
async function fetchRoomData(roomId) {
  try {
    const response = await fetch(`/api/room?id=${encodeURIComponent(roomId)}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.imageData) {
        renderImage(data.imageData);
        return;
      }
    }
    
    // Clear display if room is empty or 404
    clearDisplay();
  } catch (err) {
    console.error('Failed to fetch room data from backend:', err);
  }
}

function setRoom(roomId) {
  currentRoom = roomId;
  window.location.hash = roomId;
  if (roomInput) roomInput.value = roomId;
  updateQRCode(window.location.href);
  fetchRoomData(roomId);
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

// --- Button Actions ---

// 1. COPY BUTTON: Converts Image to PNG Blob and writes to Clipboard
if (btnCopy) {
  btnCopy.addEventListener('click', async () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      alert("No image available to copy!");
      return;
    }

    try {
      const pngBlob = await getCanvasPngBlob(imageDisplay);

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);

      const originalText = btnCopy.textContent;
      btnCopy.textContent = '✅ Copied!';
      setTimeout(() => { btnCopy.textContent = originalText; }, 2000);
    } catch (err) {
      console.error('Clipboard Error:', err);

      if (!window.isSecureContext) {
        alert("Copying images directly requires HTTPS or http://localhost.");
      } else {
        alert("Copy failed. Try right-clicking the image directly and selecting 'Copy Image'.");
      }
    }
  });
}

// 2. SAVE BUTTON: Posts ImageData to Backend Room Store
if (btnSave) {
  btnSave.addEventListener('click', async () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      alert("No image available to save!");
      return;
    }

    const originalText = btnSave.textContent;
    btnSave.textContent = 'Saving...';

    try {
      const response = await fetch(`/api/room?id=${encodeURIComponent(currentRoom)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imageDisplay.src })
      });

      if (response.ok) {
        btnSave.textContent = '✅ Saved to Room!';
      } else {
        const errData = await response.json();
        alert(`Failed to save: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert("Network error: Could not save image to room endpoint.");
    } finally {
      setTimeout(() => { btnSave.textContent = originalText; }, 2000);
    }
  });
}

// 3. REFRESH BUTTON: Syncs room payload from Backend Store
if (btnRefresh) {
  btnRefresh.addEventListener('click', async () => {
    const originalText = btnRefresh.textContent;
    btnRefresh.textContent = 'Syncing...';
    await fetchRoomData(currentRoom);
    setTimeout(() => { btnRefresh.textContent = originalText; }, 1000);
  });
}

// 4. CLEAR BUTTON: Clears UI display
if (btnClear) {
  btnClear.addEventListener('click', () => {
    clearDisplay();
  });
}

// --- Global Paste & Drag-Drop Event Listeners ---
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

// Entrypoint Initialization
initRoom();
