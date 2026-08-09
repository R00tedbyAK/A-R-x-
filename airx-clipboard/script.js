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

function setRoom(roomId) {
  currentRoom = roomId;
  window.location.hash = roomId;
  if (roomInput) roomInput.value = roomId;
  updateQRCode(window.location.href);

  // Automatically fetch room content saved by other devices
  fetchRoomImageContent(roomId);
}

function initRoom() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    setRoom(hash);
  } else {
    setRoom(generateHandle());
  }
}

// --- Image Display Helpers ---

function renderImage(dataUrl) {
  imageDisplay.src = dataUrl;
  if (emptyState) emptyState.classList.add('hidden');
  if (imageDisplayContainer) imageDisplayContainer.classList.remove('hidden');
}

function clearCanvas() {
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

// --- Backend API Syncing (Cross-Device Core) ---

// 1. FETCH CONTENT: Retrieves saved room content from backend
async function fetchRoomImageContent(roomId) {
  try {
    const res = await fetch(`/api/room?id=${roomId}`);
    if (!res.ok) {
      clearCanvas();
      return;
    }
    const data = await res.json();
    if (data && data.imageData) {
      renderImage(data.imageData);
    }
  } catch (err) {
    console.log('No existing room data found on backend.');
  }
}

// 2. SAVE BUTTON ACTION: Uploads the active image payload to the backend room URL
if (btnSave) {
  btnSave.addEventListener('click', async () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      alert("No image available to save!");
      return;
    }

    const origText = btnSave.textContent;
    btnSave.textContent = 'Syncing...';

    try {
      const response = await fetch(`/api/room?id=${currentRoom}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imageDisplay.src })
      });

      if (response.ok) {
        btnSave.textContent = 'Saved to Room!';
      } else {
        btnSave.textContent = 'Error Saving';
      }
    } catch (err) {
      alert("Failed to sync room content across devices.");
      btnSave.textContent = 'Save Failed';
    }

    setTimeout(() => { btnSave.textContent = origText; }, 2000);
  });
}

// --- Other Toolbar Buttons ---

// COPY BUTTON
if (btnCopy) {
  btnCopy.addEventListener('click', async () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      alert("No image to copy!");
      return;
    }
    try {
      const response = await fetch(imageDisplay.src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      const origText = btnCopy.textContent;
      btnCopy.textContent = '✅ Copied!';
      setTimeout(() => { btnCopy.textContent = origText; }, 2000);
    } catch (err) {
      alert("Copy failed. Try right-clicking the image directly.");
    }
  });
}

// REFRESH BUTTON
if (btnRefresh) {
  btnRefresh.addEventListener('click', async () => {
    const origText = btnRefresh.textContent;
    btnRefresh.textContent = 'Syncing...';
    await fetchRoomImageContent(currentRoom);
    setTimeout(() => { btnRefresh.textContent = origText; }, 800);
  });
}

// CLEAR BUTTON
if (btnClear) {
  btnClear.addEventListener('click', () => {
    clearCanvas();
  });
}

// --- Global Event Listeners ---

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

  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
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
    clearCanvas();
  });
}

if (copyUrlBtn) {
  copyUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    const origText = copyUrlBtn.textContent;
    copyUrlBtn.textContent = 'Link Copied!';
    setTimeout(() => { copyUrlBtn.textContent = origText; }, 2000);
  });
}

// Initialization
initRoom();
