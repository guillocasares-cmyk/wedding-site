// Shared Spotify helper for the song search and add functions.
// Needs three environment variables in Vercel:
//   SPOTIFY_CLIENT_ID, SPOTIFY_REFRESH_TOKEN, SPOTIFY_PLAYLIST_ID
let cache = { token: null, exp: 0 };

async function getAccessToken() {
  if (cache.token && Date.now() < cache.exp - 30000) return cache.token;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: process.env.SPOTIFY_REFRESH_TOKEN || '',
    client_id: process.env.SPOTIFY_CLIENT_ID || ''
  });
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!r.ok) throw new Error('token ' + r.status);
  const j = await r.json();
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return j.access_token;
}

async function spotify(path, opts) {
  const o = opts || {};
  const token = await getAccessToken();
  return fetch('https://api.spotify.com/v1' + path, {
    method: o.method || 'GET',
    body: o.body,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
  });
}

function configured() {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_REFRESH_TOKEN && process.env.SPOTIFY_PLAYLIST_ID);
}

module.exports = { spotify, configured };
