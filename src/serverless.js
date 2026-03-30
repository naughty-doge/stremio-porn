import { getRouter } from 'stremio-addon-sdk'
import addonInterface, { MANIFEST } from './addon'


const CACHE = process.env.GOONHUB_CACHE || '1'
const PROXY = process.env.GOONHUB_PROXY || process.env.HTTPS_PROXY

let router = getRouter(addonInterface)


export default function handler(req, res) {
  if (req.url === '/api/status') {
    let status = {
      manifest: {
        name: MANIFEST.name,
        version: MANIFEST.version,
        description: MANIFEST.description,
        catalogs: MANIFEST.catalogs,
      },
      config: {
        cache: CACHE !== '0',
        proxy: !!PROXY,
      },
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(status))
    return
  }

  router(req, res, () => {
    res.statusCode = 404
    res.end()
  })
}
