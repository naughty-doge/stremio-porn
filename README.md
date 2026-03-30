<p align="center">
  <img src="/static/logo.png">
</p>
<h1 align="center" style="border: 0">GoonHub - Addon for Stremio</h1>
<p align="center">
  <em>Time to unsheathe your sword!</em>
</p>
<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVarKhir%2Fgoonhub&env=GOONHUB_ID&envDescription=GOONHUB_ID%3A%20Unique%20addon%20identifier.&project-name=goonhub&repository-name=goonhub">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

This is a [Stremio](https://www.stremio.com/) addon that provides porn content from various websites:

- __Videos__ _(Movies)_: PornHub, RedTube, YouPorn, SpankWire and Porn.com
- __Webcam streams__ _(TV Channels)_: Chaturbate


## Features

- Adds a dedicated tab in Discover for each website
- Works in Stremio v5, v4 and v3.6
- Uses the modern `stremio-addon-sdk` for full v5 compatibility
- Provides Stremio catalogs for all supported porn sites
- **Deployable on Vercel** — one-click deploy with the button above
- **Web UI for configuring debrid services** (Real-Debrid, Torbox) — no environment variables needed for debrid tokens
- Torbox cache availability is checked before unrestricting links for reliable results
- Optional Usenet streaming passthrough for IMDb/TMDb/TVDB ids (e.g. [UsenetStreamer](https://github.com/Sanket9225/UsenetStreamer))
- Supports Docker out of the box
- Caches results in memory
- Limits the number of concurrent requests to avoid overloading the sites
- Supports HTTPS proxy
- Configurable via environment variables
- Prints a nicely formatted status message when run
- The logo is dope 🗡💖


## Running

The addon is a web server that fetches video streams from the porn sites in response to requests from Stremio clients. It uses environment variables for server configuration and includes a handful of npm scripts to run with or without Docker.

### Quick Start (Local)

To install and quickly start the addon, do:

```bash
git clone https://github.com/VarKhir/goonhub
cd goonhub
yarn # or `npm install`
yarn start # or `npm start`
```

By default the server starts on `localhost:80` in development mode and doesn't announce itself to the Stremio addon tracker. To add the addon to Stremio, open its endpoint in the browser and click the Install button, or enter the URL in the app's Addons section.

In order for the addon to work publicly, the following environment variables must be set:
- `NODE_ENV` to `production`
- `GOONHUB_ENDPOINT` to a public URL of the server
- `GOONHUB_ID` to a non-default value

Note: since this addon scrapes pages, it is recommended to run it behind a proxy.

### Deploy to Vercel

Click the **Deploy with Vercel** button at the top of this README, or deploy manually:

1. Fork this repository
2. Import the project in [Vercel](https://vercel.com/new)
3. Set the required environment variable (`GOONHUB_ID`)
4. Deploy

The addon exposes a serverless function at the root URL. The endpoint URL is automatically detected from Vercel's `VERCEL_URL` environment variable — no need to set `GOONHUB_ENDPOINT` manually.


## Debrid Services

Debrid services (Real-Debrid and Torbox) can be configured directly from the web UI — no environment variables needed. Open the addon's landing page in a browser, enter your API tokens, and click **"Update Install URL"**. A personalized addon URL is generated with your tokens encoded in it. Use that URL to install the addon in Stremio.

- **Real-Debrid**: Get your API token from [real-debrid.com/apitoken](https://real-debrid.com/apitoken). Streams are unrestricted via the Real-Debrid API.
- **Torbox**: Get your API token from [torbox.app/settings](https://torbox.app/settings). Before unrestricting, the addon checks Torbox's cache availability endpoint to ensure only cached (reliable) results are returned.

Your tokens are encoded in the addon URL (base64) and are only sent to this addon server when Stremio makes requests.


## Development

The code is written in ES7 and then transpiled with Babel. It is covered by a suite of Jest tests, and the staged files are automatically linted with ESLint. The transpiled files are included in the repository: this makes for quicker start and eases deployment to different environments such as Docker and Heroku.


## npm scripts

Each of these scripts can be used with `yarn <script>` or `npm run <script>`:

- `start` launches the addon
- `prod` sets `NODE_ENV` to `production` and launches the addon
- `dev` sets `NODE_ENV` to `development` and launches the addon with node inspector activated
- `test` to run tests with Jest
- `build` builds the addon in the `dist` dir (add `-w` to watch)
- `vercel-build` builds the addon for Vercel deployment

* `docker-build` builds the Docker image
* `docker-start` launches the addon in a `goonhub` Docker container
* `docker-dev` sets `NODE_ENV` to `development` and launches the addon in a `goonhub` Docker container
* `docker-prod` sets `NODE_ENV` to `production` and launches the addon in a `goonhub` Docker container
* `docker-stop` stops the Docker container

When run in Docker using these scripts, the variables from the current shell are passed to the Docker container.


## Configuration

The addon uses environment variables for **server-level** settings. Debrid service tokens are configured per-user via the web UI (see above).

### Server Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | — | Set to `production` to announce the addon to the Stremio tracker |
| `GOONHUB_ID` | `goonhub` | Addon identifier. Must be changed from the default in production mode |
| `GOONHUB_ENDPOINT` | `http://localhost` | Public base URL of the server. Auto-detected on Vercel via `VERCEL_URL` |
| `GOONHUB_PORT` | `80` | Port the server listens on |
| `GOONHUB_EMAIL` | — | Contact email address shown in the addon manifest |
| `GOONHUB_PROXY` | — | HTTPS proxy address to route all outbound requests through |
| `GOONHUB_CACHE` | `1` | Caching mode: `0` = disabled, `1` = in-memory cache |
| `GOONHUB_USENET_STREAMER` | — | Base URL to a Usenet streaming addon for IMDb/TMDb/TVDB id passthrough |

### Hosting Provider Fallbacks

These common environment variables are used as fallbacks when the `GOONHUB_*` equivalents are not set:

| Variable | Fallback for |
|----------|-------------|
| `PORT` | `GOONHUB_PORT` |
| `EMAIL` | `GOONHUB_EMAIL` |
| `HTTPS_PROXY` | `GOONHUB_PROXY` |


## Screenshots

![Discover](/static/screenshot_discover.jpg)
