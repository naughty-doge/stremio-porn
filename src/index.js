import http from 'http'
import { URL } from 'url'
import serveStatic from 'serve-static'
import chalk from 'chalk'
import pkg from '../package.json'
import PornClient from './PornClient'


const STATIC_DIR = 'static'
const DEFAULT_ID = 'stremio_porn'

const ID = process.env.STREMIO_PORN_ID || DEFAULT_ID
const ENDPOINT = process.env.STREMIO_PORN_ENDPOINT || 'http://localhost'
const PORT = process.env.STREMIO_PORN_PORT || process.env.PORT || '80'
const PROXY = process.env.STREMIO_PORN_PROXY || process.env.HTTPS_PROXY
const CACHE = process.env.STREMIO_PORN_CACHE || process.env.REDIS_URL || '1'
const EMAIL = process.env.STREMIO_PORN_EMAIL || process.env.EMAIL
const IS_PROD = process.env.NODE_ENV === 'production'


if (IS_PROD && ID === DEFAULT_ID) {
  // eslint-disable-next-line no-console
  console.error(
    chalk.red(
      '\nWhen running in production, a non-default addon identifier must be specified\n'
    )
  )
  process.exit(1)
}

let availableSites = PornClient.ADAPTERS.map((a) => a.DISPLAY_NAME).join(', ')

const MANIFEST = {
  name: 'Porn',
  id: ID,
  version: pkg.version,
  description: `\
Time to unsheathe your sword! \
Watch porn videos and webcam streams from ${availableSites}\
`,
  types: ['movie', 'tv'],
  idPrefixes: [`${PornClient.ID}:`],
  resources: ['catalog', 'meta', 'stream'],
  catalogs: PornClient.ADAPTERS.map((Adapter) => ({
    type: Adapter.SUPPORTED_TYPES[0],
    id: Adapter.name,
    name: `Porn: ${Adapter.DISPLAY_NAME}`,
    extra: [{ name: 'search' }, { name: 'skip' }, { name: 'genre' }],
  })),
  behaviorHints: { adult: true },
  contactEmail: EMAIL,
  logo: `${ENDPOINT}/logo.png`,
  background: `${ENDPOINT}/bg.jpg`,
}

const CATALOG_RE = /^\/catalog\/([^/]+)\/([^/]+?)(?:\/([^/]+))?\.json$/
const META_RE = /^\/meta\/([^/]+)\/(.+)\.json$/
const STREAM_RE = /^\/stream\/([^/]+)\/(.+)\.json$/

let client = new PornClient({ proxy: PROXY, cache: CACHE })


function toMeta(item) {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    poster: item.poster,
    posterShape: item.posterShape,
    background: item.banner,
    description: item.description,
    genres: item.genre,
    releaseInfo: item.year,
    runtime: item.runtime,
    website: item.website,
  }
}

function toStream(stream) {
  return {
    name: stream.name,
    title: stream.title,
    url: stream.url,
  }
}

function parseExtra(extra) {
  let params = {}
  if (!extra) {
    return params
  }
  extra.split('&').forEach((pair) => {
    let [key, value] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  })
  return params
}

function sendJson(res, status, body) {
  let json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': Buffer.byteLength(json),
  })
  res.end(json)
}

async function handleCatalog(res, match) {
  let type = decodeURIComponent(match[1])
  let catalogId = decodeURIComponent(match[2])
  let adapter = PornClient.ADAPTERS.find((a) => a.name === catalogId)

  if (!adapter || !adapter.SUPPORTED_TYPES.includes(type)) {
    return sendJson(res, 404, { error: `Unknown catalog ${catalogId}` })
  }

  let params = parseExtra(match[3] && decodeURIComponent(match[3]))
  let metas = await client.invokeMethod('meta.find', {
    query: { type, search: params.search, genre: params.genre },
    sort: { [`${PornClient.SORT_PROP_PREFIX}${adapter.name}`]: -1 },
    skip: Number(params.skip) || 0,
    limit: 100,
  })

  return sendJson(res, 200, { metas: metas.map(toMeta) })
}

async function handleMeta(res, match) {
  let type = decodeURIComponent(match[1])
  let id = decodeURIComponent(match[2])
  let meta = await client.invokeMethod('meta.get', {
    // eslint-disable-next-line camelcase
    query: { porn_id: id, type },
  })

  if (!meta) {
    return sendJson(res, 404, { error: `No meta for ${id}` })
  }
  return sendJson(res, 200, { meta: toMeta(meta) })
}

async function handleStream(res, match) {
  let type = decodeURIComponent(match[1])
  let id = decodeURIComponent(match[2])
  let streams = await client.invokeMethod('stream.find', {
    // eslint-disable-next-line camelcase
    query: { porn_id: id, type },
  })

  return sendJson(res, 200, { streams: streams.map(toStream) })
}

function handleApi(res, pathname) {
  if (pathname === '/manifest.json') {
    return Promise.resolve(sendJson(res, 200, MANIFEST))
  }

  let match = pathname.match(CATALOG_RE)
  if (match) {
    return handleCatalog(res, match)
  }
  match = pathname.match(META_RE)
  if (match) {
    return handleMeta(res, match)
  }
  match = pathname.match(STREAM_RE)
  if (match) {
    return handleStream(res, match)
  }

  return Promise.resolve(sendJson(res, 404, { error: 'Not found' }))
}

function landingPage(req, res) {
  let host = (req.headers.host || 'localhost').replace(/[^\w.:-]/g, '')
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${MANIFEST.name} - Stremio Addon</title>
  <style>
    body { font-family: sans-serif; background: #1a1a2e; color: white;
           display: flex; align-items: center; justify-content: center;
           height: 100vh; margin: 0; }
    main { text-align: center; max-width: 32em; padding: 1em; }
    a.button { display: inline-block; margin: 1em 0; padding: .8em 1.6em;
               background: #7b5bf5; color: white; text-decoration: none;
               border-radius: 4px; }
    code { background: #333; padding: .2em .4em; border-radius: 4px;
           word-break: break-all; }
  </style>
</head>
<body>
  <main>
    <h1>${MANIFEST.name}</h1>
    <p>${MANIFEST.description}</p>
    <a class="button" href="stremio://${host}/manifest.json">Install</a>
    <p>If the button doesn't work, paste this URL in Stremio &rarr; Addons:</p>
    <p><code>${ENDPOINT}/manifest.json</code></p>
  </main>
</body>
</html>`
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
}

let server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    })
    return res.end()
  }
  if (req.method !== 'GET') {
    res.writeHead(405)
    return res.end()
  }

  let pathname = new URL(req.url, 'http://localhost').pathname
  serveStatic(STATIC_DIR)(req, res, () => {
    if (pathname === '/') {
      return landingPage(req, res)
    }
    handleApi(res, pathname).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(chalk.gray(new Date().toLocaleString()), req.url, err)
      sendJson(res, err instanceof URIError ? 400 : 500, { error: err.message })
    })
  })
})

server
  .on('listening', () => {
    let values = {
      endpoint: chalk.green(`${ENDPOINT}/manifest.json`),
      id: ID === DEFAULT_ID ? chalk.red(ID) : chalk.green(ID),
      email: EMAIL ? chalk.green(EMAIL) : chalk.red('undefined'),
      env: IS_PROD ? chalk.green('production') : chalk.green('development'),
      proxy: PROXY ? chalk.green(PROXY) : chalk.red('off'),
      cache: (CACHE === '0') ?
        chalk.red('off') :
        chalk.green(CACHE === '1' ? 'on' : CACHE),
    }

    // eslint-disable-next-line no-console
    console.log(`
    ${MANIFEST.name} Addon is listening on port ${PORT}

    Endpoint:    ${values.endpoint}
    Addon Id:    ${values.id}
    Email:       ${values.email}
    Environment: ${values.env}
    Proxy:       ${values.proxy}
    Cache:       ${values.cache}
    `)
  })
  .listen(PORT)


export default server
