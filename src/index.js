import http from 'http'
import Stremio from 'stremio-addons'
import cacheManager from 'cache-manager'
import Client from './Client'


const MANIFEST = {
  name: 'Porn',
  id: 'org.stremio.porn',
  version: '0.0.0',
  description: 'Time to unsheathe your sword!',
  types: ['movie', 'tv'],
  idProperty: Client.ID,
  dontAnnounce: process.env.NODE_ENV !== 'production',
  sorts: Client.SORTS,
  // icon: 'URL to 256x256 monochrome png icon',
  // background: 'URL to 1366x756 png background',
}
const CACHE_TTLS = {
  'stream.find': 300,
  'meta.find': 300,
  'meta.search': 3600,
  'meta.get': 300,
  'meta.genres': 300,
}


function makeEndpoint(name, fn, cache, cacheOptions) {
  return async (request, cb, user) => {
    let result

    if (cache) {
      let cacheKey = JSON.stringify(request)
      result = cache.wrap(cacheKey, () => fn(request, user), cacheOptions)
    } else {
      result = fn(request, user)
    }

    return result.then(
      (response) => cb(null, response),
      (err) => {
        /* eslint-disable no-console */
        console.error(
          'An error has occurred while processing ' +
          `the following request to ${name}:`
        )
        console.error(request)
        console.error(err)
        /* eslint-enable no-console */
        cb(err)
      }
    )
  }
}

function methodsToEndpoints(methods, cache) {
  return Object.keys(methods).reduce((endpoints, name) => {
    let cacheOptions = {
      ttl: CACHE_TTLS[name],
    }
    endpoints[name] = makeEndpoint(name, methods[name], cache, cacheOptions)
    return endpoints
  }, {})
}


let proxy = process.env.STREMIO_PORN_PROXY
let client = new Client({ proxy })
let cache = (process.env.STREMIO_PORN_CACHE === '0') ?
  false :
  cacheManager.caching({ store: 'memory' })

let methods = {
  'stream.find': (req) => client.getStreams(req),
  'meta.find': (req) => client.find(req),
  'meta.search': (req) => client.search(req),
  'meta.get': (req) => client.getItem(req),
  'meta.genres': (req) => client.getGenres(req),
}
let endpoints = methodsToEndpoints(methods, cache)


let addon = new Stremio.Server(endpoints, MANIFEST)
let server = http.createServer((req, res) => {
  addon.middleware(req, res, () => res.end())
})

server
  .on('listening', () => {
    /* eslint-disable no-console */
    console.log(`Porn Addon is listening on port ${server.address().port}`)

    if (proxy) {
      console.log(`Using proxy ${proxy}`)
    }

    if (cache) {
      console.log('Using cache')
    }

    /* eslint-enable no-console */
  })
  .listen(process.env.STREMIO_PORN_PORT || 8008)
