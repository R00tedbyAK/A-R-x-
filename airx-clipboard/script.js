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

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    if (typeof swal === "function") {
      swal("Invalid File", "Please select or paste a valid image file.", "error");
    } else {
      alert("Please select or paste a valid image file.");
    }
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => renderImage(e.target.result);
  reader.readAsDataURL(file);
}

// --- Button Actions (Klipit Spec) ---

// 1. COPY BUTTON: Fetches binary blob and writes to navigator.clipboard
if (btnCopy) {
  btnCopy.addEventListener('click', async () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      swal ? swal("Empty Canvas", "No image available to copy!", "warning") : alert("No image available to copy!");
      return;
    }

    try {
      const response = await fetch(imageDisplay.src);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);

      const originalText = btnCopy.textContent;
      btnCopy.textContent = '✅ Copied!';
      setTimeout(() => { btnCopy.textContent = originalText; }, 2000);
    } catch (err) {
      console.error('Copy execution error:', err);
      swal ? swal("Copy Failed", "Browser clipboard permissions blocked direct copy. Right-click image to copy manually.", "error") 
           : alert("Copy failed. Try right-clicking the image directly.");
    }
  });
}

// 2. SAVE BUTTON: Generates programmatic local anchor download
if (btnSave) {
  btnSave.addEventListener('click', () => {
    if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
      swal ? swal("Empty Canvas", "No image available to save!", "warning") : alert("No image available to save!");
      return;
    }

    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = imageDisplay.src;
    downloadAnchor.download = `airx-${currentRoom}.png`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  });
}

// 3. REFRESH BUTTON: Reloads room payload state
if (btnRefresh) {
  btnRefresh.addEventListener('click', () => {
    const originalText = btnRefresh.textContent;
    btnRefresh.textContent = 'Syncing...';
    setTimeout(() => { btnRefresh.textContent = originalText; }, 1000);
  });
}

// 4. CLEAR BUTTON: Resets image display container back to empty state
if (btnClear) {
  btnClear.addEventListener('click', () => {
    imageDisplay.src = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (imageDisplayContainer) imageDisplayContainer.classList.add('hidden');
  });
}

// --- Event Listeners ---

// Global Clipboard Paste Listener
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

// Drag and Drop Zone Handling
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

// Room Management Controls
if (goRoomBtn) {
  goRoomBtn.addEventListener('click', () => {
    const value = roomInput.value.trim();
    if (value) setRoom(value);
  });
}

if (newRoomBtn) {
  newRoomBtn.addEventListener('click', () => {
    setRoom(generateHandle());
    if (btnClear) btnClear.click();
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
