const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
// Dynamic import for node-fetch in CommonJS environments
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Configure the local API port and TMDB API key
const PORT = 300;
const TMDB_KEY = 'dfedf6eae16bbcbbda85f1ced97427e2';

// Add-on manifest
const manifest = {
  id: 'org.stremio.localhost',
  version: '1.0.0',
  name: 'Aaargh',
  description: 'Fetch streams from a local HTTP API using TMDB IDs',
  resources: ['stream'],
  types: ['movie', 'series'],
  catalogs: []
};

// Initialize the add-on builder
const builder = new addonBuilder(manifest);

// Helper: map local API JSON to Stremio streams
function mapApiToStreams(data) {
  const streams = [];
  data.forEach(item => {
    const src = item.source || item.sources;
    if (!src || !Array.isArray(src.files)) return;
    const provider = src.provider || '';
    const subs = Array.isArray(src.subtitles)
      ? src.subtitles.map(sub => ({ url: sub.url, name: sub.lang }))
      : [];
    const headers = src.headers || {};

    src.files.forEach(fileObj => {
      const qualityLabel = fileObj.quality || 'HLS';
      streams.push({
        title: `${provider} | ${qualityLabel}`,
        url: fileObj.file,
        type: fileObj.type || 'hls',
        quality: fileObj.quality,
        subtitles: subs,
        headers
      });
    });
  });
  return streams;
}

// Define the stream handler
builder.defineStreamHandler(async ({ type, id }) => {
  console.log('Received stream request:', { type, id });

  // Parse IMDB ID and S/E for series
  const parts = id.split(':');
  const imdbId = parts[0];
  let season, episode;
  if (type === 'series') {
    season = parts[1];
    episode = parts[2];
  }

  // Lookup TMDB ID
  let tmdbId;
  try {
    const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;
    const findResp = await fetch(findUrl);
    const findData = await findResp.json();
    if (type === 'movie') {
      tmdbId = findData.movie_results?.[0]?.id;
    } else {
      tmdbId = findData.tv_results?.[0]?.id;
    }
    if (!tmdbId) return { streams: [] };
  } catch (err) {
    console.error('TMDB lookup error:', err);
    return { streams: [] };
  }

  // Fetch from local API
  const apiUrl = type === 'movie'
    ? `http://localhost:3000/movie/${tmdbId}`
    : `http://localhost:3000/tv/${tmdbId}?s=${season}&e=${episode}`;
  console.log('Fetching local API:', apiUrl);

  try {
    const resp = await fetch(apiUrl);
    const data = await resp.json();
    console.log('Local API response:', data);
    const streams = mapApiToStreams(data);
    return { streams };
  } catch (err) {
    console.error('Local fetch error:', err);
    return { streams: [] };
  }
});

// Start server
serveHTTP(builder.getInterface(), { port: PORT, address: '0.0.0.0' })
  .then(() => console.log(`Addon running at http://0.0.0.0:${PORT}/manifest.json (accessible on your LAN)`))
  .catch(err => console.error('Server error:', err));
