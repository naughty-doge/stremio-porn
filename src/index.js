import http from 'http'
import { parse as parseUrl } from 'url'
import Stremio from 'stremio-addons'
import serveStatic from 'serve-static'
import chalk from 'chalk'
import pkg from '../package.json'
import PornClient from './PornClient'


const SUPPORTED_METHODS = [
  'stream.find', 'meta.find', 'meta.search', 'meta.get',
]
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
  idProperty: PornClient.ID,
  dontAnnounce: !IS_PROD,
  sorts: PornClient.SORTS,
  // The docs mention `contactEmail`, but the template uses `email`
  email: EMAIL,
  contactEmail: EMAIL,
  endpoint: `${ENDPOINT}/stremioget/stremio/v1`,
  logo: `${ENDPOINT}/logo.png`,
  icon: `${ENDPOINT}/logo.png`,
  background: `${ENDPOINT}/bg.jpg`,
  // OBSOLETE: used in pre-4.0 stremio instead of idProperty/types
  filter: {
    [`query.${PornClient.ID}`]: { $exists: true },
    'query.type': { $in: ['movie', 'tv'] },
  },
}


// Manifest for the new Stremio addon SDK REST API (v4.4+)
const SDK_CATALOGS = PornClient.ADAPTERS.reduce((catalogs, Adapter) => {
  Adapter.SUPPORTED_TYPES.forEach((type) => {
    catalogs.push({
      type,
      id: Adapter.name,
      name: `Porn: ${Adapter.DISPLAY_NAME}`,
    })
  })
  return catalogs
}, [])

const SDK_MANIFEST = {
  id: ID,
  version: pkg.version,
  name: MANIFEST.name,
  description: MANIFEST.description,
  logo: MANIFEST.logo,
  background: MANIFEST.background,
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'tv'],
  idPrefixes: [`${PornClient.ID}:`],
  catalogs: SDK_CATALOGS,
}

function sendJson(res, data) {
  let body = JSON.stringify(data)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'))
  res.end(body)
}


function makeMethod(client, methodName) {
  return async (request, cb) => {
    let response
    let error

    try {
      response = await client.invokeMethod(methodName, request)
    } catch (err) {
      error = err

      /* eslint-disable no-console */
      console.error(
        // eslint-disable-next-line prefer-template
        chalk.gray(new Date().toLocaleString()) +
        ' An error has occurred while processing ' +
        `the following request to ${methodName}:`
      )
      console.error(request)
      console.error(err)
      /* eslint-enable no-console */
    }

    cb(error, response)
  }
}

function makeMethods(client, methodNames) {
  return methodNames.reduce((methods, methodName) => {
    methods[methodName] = makeMethod(client, methodName)
    return methods
  }, {})
}


let client = new PornClient({ proxy: PROXY, cache: CACHE })
let methods = makeMethods(client, SUPPORTED_METHODS)
let addon = new Stremio.Server(methods, MANIFEST)
let server = http.createServer((req, res) => {
  let { pathname } = parseUrl(req.url)

  if (req.method === 'GET') {
    // New Stremio addon SDK (v4.4+) REST API endpoints.
    // The old stremio-addons middleware returns the HTML landing page for any
    // GET request whose path doesn't end in "q.json", so we handle these
    // routes before the old middleware can intercept them.

    if (pathname === '/manifest.json') {
      sendJson(res, SDK_MANIFEST)
      return
    }

    let streamMatch = pathname.match(/^\/stream\/([^/]+)\/(.+)\.json$/)
    if (streamMatch) {
      let type = streamMatch[1]
      let id = decodeURIComponent(streamMatch[2])
      client.invokeMethod('stream.find', { query: { [PornClient.ID]: id, type } })
        .then((streams) => sendJson(res, { streams: streams || [] }))
        .catch(() => sendJson(res, { streams: [] }))
      return
    }

    let metaMatch = pathname.match(/^\/meta\/([^/]+)\/(.+)\.json$/)
    if (metaMatch) {
      let type = metaMatch[1]
      let id = decodeURIComponent(metaMatch[2])
      client.invokeMethod('meta.get', { query: { [PornClient.ID]: id, type } })
        .then((meta) => sendJson(res, { meta: meta || null }))
        .catch(() => sendJson(res, { meta: null }))
      return
    }

    let catalogMatch = pathname.match(/^\/catalog\/([^/]+)\/([^/]+)\.json$/)
    if (catalogMatch) {
      let type = catalogMatch[1]
      let catalogId = catalogMatch[2]
      let sort = { [`popularities.porn.${catalogId}`]: -1 }
      client.invokeMethod('meta.find', { query: { type }, sort })
        .then((metas) => sendJson(res, { metas: metas || [] }))
        .catch(() => sendJson(res, { metas: [] }))
      return
    }
  }

  serveStatic(STATIC_DIR)(req, res, () => {
    addon.middleware(req, res, () => res.end())
  })
})

server
  .on('listening', () => {
    let values = {
      endpoint: chalk.green(MANIFEST.endpoint),
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
