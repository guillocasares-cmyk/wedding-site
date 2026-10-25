const { spotify, configured } = require('./_spotify');

const MAX_TRACKS = 400;        // stop guests from adding more than this
const MAX_PER_WINDOW = 10;     // songs per guest (per IP) ...
const WINDOW_MS = 10 * 60000;  // ... every 10 minutes
const hits = new Map();

// POST /api/add  { uri: "spotify:track:..." }  ->  { ok: true, duplicate: boolean }
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!configured()) return res.status(500).json({ error: 'config' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const uri = String((body && body.uri) || '');
  if (!/^spotify:track:[A-Za-z0-9]{22}$/.test(uri)) return res.status(400).json({ error: 'bad' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return res.status(429).json({ error: 'rate' });

  const playlist = process.env.SPOTIFY_PLAYLIST_ID;
  try {
    // Skip songs that are already in the playlist, and stop at the size cap.
    let offset = 0, total = 0;
    for (let page = 0; page < 12; page++) {
      const r = await spotify('/playlists/' + playlist + '/items?limit=50&offset=' + offset);
      if (!r.ok) break; // if reading fails, still try to add
      const j = await r.json();
      const items = (j && j.items) || [];
      total = (j && j.total) || offset + items.length;
      for (const it of items) {
        const t = it && (it.track || it.item);
        if (t && t.uri === uri) return res.status(200).json({ ok: true, duplicate: true });
      }
      offset += items.length;
      if (!items.length || offset >= total) break;
    }
    if (total >= MAX_TRACKS) return res.status(409).json({ error: 'full' });

    const add = await spotify('/playlists/' + playlist + '/items', {
      method: 'POST',
      body: JSON.stringify({ uris: [uri] })
    });
    if (!add.ok) return res.status(502).json({ error: 'add' });

    recent.push(now);
    hits.set(ip, recent);
    return res.status(200).json({ ok: true, duplicate: false });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
