import http from 'http'
import { getRouter } from 'stremio-addon-sdk'
import serveStatic from 'serve-static'
import chalk from 'chalk'
import addonInterface, { MANIFEST } from './addon'


const STATIC_DIR = 'static'
const PORT = process.env.GOONHUB_PORT || process.env.PORT || '80'
const PROXY = process.env.GOONHUB_PROXY || process.env.HTTPS_PROXY
const CACHE = process.env.GOONHUB_CACHE || '1'
const EMAIL = process.env.GOONHUB_EMAIL || process.env.EMAIL
const IS_PROD = process.env.NODE_ENV === 'production'

let router = getRouter(addonInterface)

let server = http.createServer((req, res) => {
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

  serveStatic(STATIC_DIR)(req, res, () => {
    router(req, res, () => res.end())
  })
})

server
  .on('listening', () => {
    let id = MANIFEST.id
    let values = {
      id: IS_PROD ? chalk.green(id) : chalk.green(id),
      email: EMAIL ?
        chalk.green(EMAIL) : chalk.red('undefined'),
      env: IS_PROD ?
        chalk.green('production') :
        chalk.green('development'),
      proxy: PROXY ? chalk.green(PROXY) : chalk.red('off'),
      cache: (CACHE === '0') ?
        chalk.red('off') :
        chalk.green('on'),
    }

    // eslint-disable-next-line no-console
    console.log(`
    ${MANIFEST.name} v${MANIFEST.version} is listening on port ${PORT}

    Addon Id:    ${values.id}
    Email:       ${values.email}
    Environment: ${values.env}
    Proxy:       ${values.proxy}
    Cache:       ${values.cache}
    `)
  })
  .listen(PORT)


export default server
