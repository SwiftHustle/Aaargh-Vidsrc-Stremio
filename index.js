const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
// Dynamic import for node-fetch in CommonJS environments
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Configure the local API port
const PORT = 300;

// Create the addon manifest with SDK's built-in configuration
const manifest = {
  id: 'org.stremio.vidsrc.aaargh',
  version: '1.2.0',
  name: 'Aaargh',
  description: 'Fetches HLS streams from Vidsrc and similar platforms. BYO TMDB API Key',
  resources: ['stream'],
  types: ['movie', 'series'],
  catalogs: [],
  behaviorHints: {
    configurable: true,
    configurationRequired: true
  },
  config: [
    {
      key: 'tmdb_token',
      type: 'password',
      title: 'TMDB API Token',
      required: true
    }
  ]
};

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

// Create the addon builder
const builder = new addonBuilder(manifest);

// Define the stream handler - SDK automatically passes user config
builder.defineStreamHandler(async ({ type, id, config }) => {
  console.log('Received stream request:', { type, id, config });

  // Get TMDB token from user config (SDK automatically provides this)
  const TMDB_KEY = config?.tmdb_token;
  if (!TMDB_KEY) {
    console.error('No TMDB token provided in config');
    return { streams: [] };
  }

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
    ? `https://tmbd-serverless.vercel.app/api/movie/${tmdbId}?api_key=${TMDB_KEY}`
    : `https://tmbd-serverless.vercel.app/api/tv/${tmdbId}?s=${season}&e=${episode}&api_key=${TMDB_KEY}`;
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

// Use the SDK's built-in HTTP server with configuration support
serveHTTP(builder.getInterface(), { port: PORT }, () => {
  console.log(`Addon running at http://0.0.0.0:${PORT}/manifest.json (accessible on your LAN)`);
  console.log(`Configuration page: http://0.0.0.0:${PORT}/configure`);
});
