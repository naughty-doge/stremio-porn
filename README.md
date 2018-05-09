<p align="center">
  <img src="/static/logo.png">
</p>
<h1 align="center" style="border: 0">Porn Addon for Stremio</h1>
<p align="center">
  <em>Time to unsheathe your sword!</em>
</p>

This is a [Stremio](https://www.stremio.com/) addon that provides porn content from various websites:

- __Videos__ _(Movies)_: PornHub, RedTube, YouPorn, SpankWire and Porn.com
- __Webcam streams__ _(TV Channels)_: Chaturbate


## Features

- Adds a dedicated tab in Discover for each website
- Works in Stremio v4 and v3.6
- Supports Docker out of the box
- Caches results in memory or Redis
- Supports HTTPS proxy
- Configurable via environment variables


## Running

The addon is a web server that fetches video streams from the porn sites in response to requests from Stremio clients. It uses environment variables for configuration and includes a handful of npm scripts to run with or without Docker.

To install and quickly start the addon, do:

```
git clone https://github.com/naughty-doge/stremio-porn
cd stremio-porn
npm install
npm start
```

By default the server starts on `localhost:8008` in development mode and doesn't announce itself to the Stremio addon tracker. To add the addon to Stremio, open its endpoint in the browser and click the Install button, or enter the URL in the app's Addons section.

In order for the addon to work publicly, the following environment variables must be set:
- `NODE_ENV` to `production`
- `STREMIO_PORN_ENDPOINT` to a public URL of the server
- `STREMIO_PORN_ID` to a non-default value


## npm scripts

Each of these scripts can be used with `npm run <script>` or `yarn <script>`:

- `start` launches the addon
- `prod` sets `NODE_ENV` to `production` and launches the addon
- `dev` sets `NODE_ENV` to `development` and launches the addon with node inspector activated
- `build` builds the addon in the `dist` dir

* `docker-build` builds the Docker image
* `docker-start` launches the addon in a `stremio-porn` Docker container
* `docker-dev` sets `NODE_ENV` to `development` and launches the addon in a `stremio-porn` Docker container
* `docker-prod` sets `NODE_ENV` to `production` and launches the addon in a `stremio-porn` Docker container
* `docker-stop` stops the Docker container


## Configuration

To configure the addon, set the following environment variables before running it:

- `NODE_ENV` — when set to `production`, the addon will announce its endpoint to the Stremio addon tracker
- `STREMIO_PORN_ID` — addon identifier, must be non-default in production mode (defaults to `stremio_porn`)
- `STREMIO_PORN_ENDPOINT` — URL to use as the endpoint, must be public in production mode (defaults to `http://localhost`)
- `STREMIO_PORN_PORT` — port to listen to (defaults to `8008`)
- `STREMIO_PORN_EMAIL` — email address that can be used to contact you (unset by default)
- `STREMIO_PORN_PROXY` — HTTPS proxy address to route all the outbound requests to (unset by default)
- `STREMIO_PORN_CACHE` — 0 to turn caching off, 1 to cache in memory, or a Redis URL (e.g. `redis://example.com:6379`) to cache in Redis (defaults to 1)


## Screenshots

![Discover](/static/screenshot_discover.jpg)
