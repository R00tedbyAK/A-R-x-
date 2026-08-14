export default async function handler(req, res) {
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

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return res.status(500).json({ error: 'Database environment variables missing on Vercel.' });
  }

  // 1. SAVE ACTION (POST): Store image in persistent Redis DB
  if (req.method === 'POST') {
    const { imageData } = req.body || {};
    if (!imageData) {
      return res.status(400).json({ error: 'No image payload provided.' });
    }

    // EX 86400 automatically expires/cleans up the room after 24 hours
    const redisResponse = await fetch(`${redisUrl}/set/room:${id}?ex=86400`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}` },
      body: JSON.stringify({ imageData, updatedAt: Date.now() })
    });

    if (redisResponse.ok) {
      return res.status(200).json({ success: true, message: `Data saved to room ${id}` });
    } else {
      return res.status(500).json({ error: 'Failed to write image payload to database.' });
    }
  }

  // 2. FETCH ACTION (GET): Retrieve image from persistent Redis DB
  if (req.method === 'GET') {
    const redisResponse = await fetch(`${redisUrl}/get/room:${id}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });

    const data = await redisResponse.json();

    if (!data.result) {
      return res.status(404).json({ error: 'Room is empty or expired.' });
    }

    // Parse stored JSON string
    const roomData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    return res.status(200).json(roomData);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
