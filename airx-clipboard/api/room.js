// In-memory key-value store for active room payloads
const roomStore = new Map();

export default function handler(req, res) {
  // Enable CORS so requests from any client work smoothly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing room ID parameter.' });
  }

  // 1. SAVE ACTION (POST): Device A uploads image data to the room ID
  if (req.method === 'POST') {
    const { imageData } = req.body || {};
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image payload provided.' });
    }

    roomStore.set(id, {
      imageData,
      updatedAt: Date.now()
    });

    return res.status(200).json({ success: true, message: `Data saved to room ${id}` });
  }

  // 2. FETCH ACTION (GET): Device B requests image data saved under the room ID
  if (req.method === 'GET') {
    const roomData = roomStore.get(id);

    if (!roomData) {
      return res.status(404).json({ error: 'Room is empty or expired.' });
    }

    return res.status(200).json(roomData);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
