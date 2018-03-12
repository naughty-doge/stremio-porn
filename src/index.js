import http from 'http'
import Stremio from 'stremio-addons'
import PornClient from './PornClient'


const MANIFEST = {
  name: 'Porn',
  id: 'org.stremio.porn',
  version: '0.0.0',
  description: 'Time to unsheathe your sword!',
  types: ['movie', 'series', 'channel', 'tv'],
  idProperty: PornClient.ID,
  dontAnnounce: process.env.NODE_ENV === 'production',
  sorts: PornClient.SORTS,
  // icon: 'URL to 256x256 monochrome png icon',
  // background: 'URL to 1366x756 png background',
}


function makeEndpoint(name, fn) {
  return async (request, cb, user) => {
    fn(request, user).then(
      (result) => cb(null, result),
      (err) => {
        /* eslint-disable no-console */
        console.error(
          'An error has occurred while processing ' +
          `the following request to ${name}:`
        )
        console.error(request)
        console.error(err)
        cb(err)
      }
    )
  }
}

let client = new PornClient()
let methods = {
  'stream.find': makeEndpoint('stream.find', (req) => {
    return client.getStreams(req)
  }),
  'meta.find': makeEndpoint('meta.find', (req) => {
    return client.find(req)
  }),
  'meta.get': makeEndpoint('meta.get', (req) => {
    return client.getItem(req)
  }),
  'meta.search': makeEndpoint('meta.search', (req) => {
    return client.search(req)
  }),
  'meta.genres': makeEndpoint('meta.genres', () => {
    throw new Error('Not implemented')
  }),
}


let addon = new Stremio.Server(methods, MANIFEST)
let server = http.createServer((req, res) => {
  addon.middleware(req, res, () => res.end())
})

server
  .on('listening', () => {
    console.log(`Porn Addon is listening on port ${server.address().port}`)
  })
  .listen(process.env.PORT || 8008)
