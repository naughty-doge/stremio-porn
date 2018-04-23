import http from 'http'
import Stremio from 'stremio-addons'
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
const SUPPORTED_METHODS = [
  'stream.find', 'meta.find', 'meta.search', 'meta.get',
]
const DEFAULT_PORT = 8008


function makeMethod(client, methodName) {
  return (request, cb) => {
    return client.invokeMethod(methodName, request).then(
      (response) => cb(null, response),
      (err) => {
        /* eslint-disable no-console */
        console.error(
          'An error has occurred while processing ' +
          `the following request to ${methodName}:`
        )
        console.error(request)
        console.error(err)
        /* eslint-enable no-console */
        cb(err)
      }
    )
  }
}

function makeMethods(client, methodNames) {
  return methodNames.reduce((methods, methodName) => {
    methods[methodName] = makeMethod(client, methodName)
    return methods
  }, {})
}


let proxy = process.env.STREMIO_PORN_PROXY
let cache = (process.env.STREMIO_PORN_CACHE !== '0')
let client = new Client({ proxy, cache })
let methods = makeMethods(client, SUPPORTED_METHODS)


let addon = new Stremio.Server(methods, MANIFEST)
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
  .listen(process.env.STREMIO_PORN_PORT || DEFAULT_PORT)
