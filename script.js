// --- Word list & Memorable Room ID Generator ---
const roomWords = [
  'cat', 'touch', 'nano', 'ghost', 'alpha', 'pulse', 'orbit', 'sonic', 'drift'
];

// Generates memorable room IDs (e.g., touch7931, cat2356, nano5491)
function generateHandle() {
  // Pick a random word from the array
  const randomWord = roomWords[Math.floor(Math.random() * roomWords.length)];
  
  // Generate a random 4-digit number between 1000 and 9999
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

// --- Core Helper Functions ---

function updateQRCode(url) {
  const qrContainer = document.getElementById('qrcode');
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
  roomInput.value = roomId;
  updateQRCode(window.location.href);

  // BACKEND INTEGRATION POINT:
  // fetchRoomImageContent(roomId);
}

function initRoom() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    setRoom(hash);
  } else {
    setRoom(generateHandle());
  }
}

function renderImage(dataUrl) {
  imageDisplay.src = dataUrl;
  emptyState.classList.add('hidden');
  imageDisplayContainer.classList.remove('hidden');

  // BACKEND INTEGRATION POINT:
  // uploadRoomImageContent(currentRoom, dataUrl);
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => renderImage(e.target.result);
  reader.readAsDataURL(file);
}

// --- Action Toolbar Controls ---

// 1. COPY ACTION
btnCopy.addEventListener('click', async () => {
  if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
    alert('No image to copy!');
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
    setTimeout(() => btnCopy.textContent = origText, 2000);
  } catch (err) {
    alert('Copy failed. Try right-clicking the image directly.');
  }
});

// 2. REFRESH ACTION
btnRefresh.addEventListener('click', () => {
  const origText = btnRefresh.textContent;
  btnRefresh.textContent = 'Syncing...';
  
  // Reload content logic
  // fetchRoomImageContent(currentRoom);

  setTimeout(() => btnRefresh.textContent = origText, 1000);
});

// 3. SAVE ACTION
btnSave.addEventListener('click', () => {
  if (!imageDisplay.src || imageDisplayContainer.classList.contains('hidden')) {
    alert('No image to save!');
    return;
  }
  const link = document.createElement('a');
  link.href = imageDisplay.src;
  link.download = `clipimage-${currentRoom}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// 4. CLEAR ACTION
btnClear.addEventListener('click', () => {
  imageDisplay.src = '';
  emptyState.classList.remove('hidden');
  imageDisplayContainer.classList.add('hidden');

  // BACKEND INTEGRATION POINT:
  // deleteRoomImageContent(currentRoom);
});

// --- Event Listeners ---

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

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

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

// Room navigation controls
goRoomBtn.addEventListener('click', () => {
  const val = roomInput.value.trim();
  if (val) setRoom(val);
});

newRoomBtn.addEventListener('click', () => {
  setRoom(generateHandle());
  btnClear.click();
});

copyUrlBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href);
  copyUrlBtn.textContent = 'Link Copied!';
  setTimeout(() => copyUrlBtn.textContent = 'Copy Room URL', 2000);
});

// Initialize app state
initRoom();