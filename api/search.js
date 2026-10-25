const { spotify, configured } = require('./_spotify');

// GET /api/search?q=...  ->  { tracks: [{ uri, name, artists, image }] }
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) return res.status(500).json({ error: 'config' });
  const q = String((req.query && req.query.q) || '').trim().slice(0, 100);
  if (q.length < 2) return res.status(200).json({ tracks: [] });
  try {
    const r = await spotify('/search?type=track&limit=8&q=' + encodeURIComponent(q));
    if (!r.ok) return res.status(502).json({ error: 'search' });
    const j = await r.json();
    const items = (j && j.tracks && j.tracks.items) || [];
    const tracks = items.filter(t => t && t.uri).map(t => {
      const imgs = (t.album && t.album.images) || [];
      const img = imgs[2] || imgs[1] || imgs[0] || {};
      return {
        uri: t.uri,
        name: t.name || '',
        artists: (t.artists || []).map(a => a.name).join(', '),
        image: img.url || ''
      };
    });
    return res.status(200).json({ tracks });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
