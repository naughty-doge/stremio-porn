import http from 'http'
import Stremio from 'stremio-addons'
import PornClient from './PornClient'


const MANIFEST = {
  name: 'Porn',
  id: 'org.stremio.porn',
  version: '0.0.0',
  description: 'Time to unsheathe your sword!',
  types: ['movie', 'series', 'tv'],
  idProperty: PornClient.ID,
  dontAnnounce: process.env.NODE_ENV === 'production',
  sorts: PornClient.SORTS,
  // icon: 'URL to 256x256 monochrome png icon',
  // background: 'URL to 1366x756 png background',
}


let toStremioEndpoint = (fn) => {
  return (request, cb, user) => {
    fn(request, user).then(
      (result) => cb(null, result),
      (err) => {
        /* eslint-disable no-console */
        console.error(err)
        console.error(request)
        cb(err)
      }
    )
  }
}

let client = new PornClient()
let methods = {
  'stream.find': toStremioEndpoint((req) => client.getStreams(req)),
  'meta.find': toStremioEndpoint((req) => client.find(req)),
  'meta.get': toStremioEndpoint((req) => client.getItem(req)),
  'meta.search': toStremioEndpoint((req) => client.search(req)),
  'meta.genres': (request, cb) => {
    console.log('meta.genres')
    console.log(request)
    cb()
    // cb expects array of strings (genres)
  },
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
