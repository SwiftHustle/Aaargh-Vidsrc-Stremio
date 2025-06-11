# Aaargh - Stremio Addon

A configurable Stremio addon that fetches HLS streams from Vidsrc and similar platforms for movies and TV series. This addon requires your own TMDB API key for operation.

## Features

- 🎬 Streams movies and TV series
- 🔧 User-configurable TMDB API token
- 🌐 HLS streaming support
- 📱 Works with all Stremio platforms
- 🔒 Secure token handling via Stremio's built-in configuration system

## Prerequisites

- **Node.js** (version 14 or higher)
- **TMDB API Key** - Get yours free at [The Movie Database](https://www.themoviedb.org/settings/api)

## Configuration

### Getting a TMDB API Key

1. Go to [The Movie Database](https://www.themoviedb.org)
2. Create a free account
3. Navigate to Settings → API
4. Request an API key (choose "Developer" option)
5. Copy your API key for use in the addon

### Configuring the Addon in Stremio

1. **Add the addon to Stremio:**
   - Open Stremio
   - Go to Addons
   - Click the "+" button
   - Enter: `http://localhost:300/manifest.json`
   - Click "Install"

2. **Configure your TMDB API key:**
   - After installation, Stremio will automatically prompt you to configure the addon
   - Enter your TMDB API token in the "TMDB API Token" field
   - Click "Save"

3. **Start streaming:**
   - The addon will now appear in your Stremio library
   - Browse movies and TV shows to see available streams

## How It Works

1. **Stream Discovery:** When you select a movie or TV episode in Stremio, the addon receives the request with the IMDB ID
2. **TMDB Lookup:** The addon uses your TMDB API key to convert the IMDB ID to a TMDB ID
3. **Stream Fetching:** It queries the backend API (`tmbd-serverless.vercel.app`) for available streams
4. **Stream Mapping:** Available streams are formatted and returned to Stremio for playback

## API Endpoints

The addon exposes several endpoints:

- `GET /manifest.json` - Addon manifest (unconfigured)
- `GET /configure` - Configuration page
- `GET /{config}/manifest.json` - Configured addon manifest
- `GET /{config}/stream/{type}/{id}` - Stream handler

## Technical Details

### Dependencies

- **stremio-addon-sdk** (^1.6.10) - Official Stremio addon SDK
- **node-fetch** (^3.3.2) - HTTP client for API requests

### Configuration Schema

```json
{
  "config": [
    {
      "key": "tmdb_token",
      "type": "password",
      "title": "TMDB API Token",
      "required": true
    }
  ]
}
```

### Stream Response Format

```json
{
  "streams": [
    {
      "title": "Provider | Quality",
      "url": "https://stream-url.m3u8",
      "type": "hls",
      "quality": "1080p",
      "subtitles": [
        {
          "url": "https://subtitle-url.vtt",
          "name": "English"
        }
      ]
    }
  ]
}
```

## Development

### Running in Development Mode

```bash
# Start the addon
node index.js

# The addon will be available at:
# - http://localhost:300/manifest.json
# - http://localhost:300/configure
```

### Debugging

The addon logs important information to the console:
- Stream requests received
- TMDB API lookups
- Backend API calls
- Error messages

### Project Structure

```
stremioaddon/
├── index.js           # Main addon file
├── package.json       # Node.js dependencies
├── package-lock.json  # Locked dependency versions
├── README.md          # This file
└── .gitignore        # Git ignore rules
```

## Troubleshooting

### Common Issues

1. **"No streams found"**
   - Verify your TMDB API key is correct
   - Check that the movie/show has streams available
   - Look at console logs for API errors

2. **Addon not installing in Stremio**
   - Ensure the addon is running (`node index.js`)
   - Check that port 300 is not blocked by firewall
   - Verify the URL: `http://localhost:300/manifest.json`

3. **Configuration not saving**
   - Make sure you're using a recent version of Stremio
   - Try refreshing the addon page
   - Check browser console for errors

### Getting Help

- Check the console output for error messages
- Verify your TMDB API key is valid
- Ensure all dependencies are installed (`npm install`)

## License

ISC License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Disclaimer

This addon is for educational purposes. Ensure you comply with all applicable laws and the terms of service of the streaming platforms you access. 