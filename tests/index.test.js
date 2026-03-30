/* eslint-disable no-console */

import { get } from 'http'


jest.mock('../src/PornClient', () => {
  let MockPornClient = jest.fn().mockImplementation(() => ({
    invokeMethod: jest.fn().mockResolvedValue([]),
  }))
  MockPornClient.ID = 'porn_id'
  MockPornClient.SORT_PROP_PREFIX = 'popularities.porn.'
  MockPornClient.getAdapters = jest.fn().mockReturnValue([
    {
      DISPLAY_NAME: 'TestSite',
      name: 'TestSite',
      SUPPORTED_TYPES: ['movie'],
    },
  ])
  MockPornClient.getSorts = jest.fn().mockReturnValue([])
  MockPornClient.getCatalogs = jest.fn().mockReturnValue([
    {
      type: 'movie',
      id: 'testsite-movie',
      name: 'TestSite',
      extra: [{ name: 'search' }, { name: 'skip' }],
      extraSupported: ['search', 'skip'],
    },
  ])
  MockPornClient.getIdPrefixes = jest.fn().mockReturnValue([])
  MockPornClient.getSearchCatalogs = jest.fn().mockReturnValue([
    {
      type: 'movie',
      id: 'goonhub-search-movie',
      name: 'GoonHub Search',
      extra: [{ name: 'search', isRequired: true }, { name: 'skip' }],
      extraSupported: ['search', 'skip'],
    },
  ])
  MockPornClient.SEARCH_CATALOG_PREFIX = 'goonhub-search-'
  return { default: MockPornClient, __esModule: true }
})

// Prevent the addon from printing
// eslint-disable-next-line no-unused-vars
let log = console.log
console.log = () => {}
console.error = () => {}

function reset() {
  jest.resetModules()

  delete process.env.GOONHUB_ID
  delete process.env.GOONHUB_ENDPOINT
  delete process.env.GOONHUB_PORT
  delete process.env.GOONHUB_PROXY
  delete process.env.GOONHUB_CACHE
  delete process.env.GOONHUB_EMAIL
  delete process.env.VERCEL_URL
  delete process.env.NODE_ENV
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        res.body = body
        resolve(res)
      })
    }).on('error', reject)
  })
}

function initAddon() {
  return {
    start() {
      // eslint-disable-next-line global-require
      this.server = require('../src/index').default

      return new Promise((resolve, reject) => {
        this.server.once('listening', () => resolve(this))
        this.server.once('error', (err) => {
          reject(err)
          this.stop()
        })
      })
    },

    stop() {
      if (!this.server) {
        return Promise.resolve(this)
      }

      let stopPromise = new Promise((resolve) => {
        this.server.once('close', () => resolve(this))
      })
      this.server.close()
      return stopPromise
    },
  }
}

describe('Addon @integration', () => {
  let addon

  beforeEach(() => {
    reset()
    addon = initAddon()
  })

  afterEach(() => {
    return addon.stop()
  })

  test('starts on the specified port', async () => {
    process.env.GOONHUB_PORT = '9028'
    await addon.start()
    expect(addon.server.address().port).toBe(9028)
  })

  test('manifest.json returns a valid manifest', async () => {
    process.env.GOONHUB_PORT = '9029'
    await addon.start()

    let res = await httpGet('http://localhost:9029/manifest.json')
    expect(res.statusCode).toBe(200)

    let manifest = JSON.parse(res.body)
    expect(manifest.id).toBeTruthy()
    expect(manifest.name).toBe('GoonHub')
    expect(manifest.version).toBeTruthy()
    expect(manifest.resources).toEqual(
      expect.arrayContaining(['catalog', 'meta', 'stream'])
    )
    expect(manifest.types).toEqual(
      expect.arrayContaining(['movie', 'tv'])
    )
    expect(manifest.catalogs.length).toBeGreaterThan(0)
  })

  test('catalog endpoint returns metas', async () => {
    process.env.GOONHUB_PORT = '9030'
    await addon.start()

    let url =
      'http://localhost:9030/catalog/movie/testsite-movie.json'
    let res = await httpGet(url)
    expect(res.statusCode).toBe(200)

    let data = JSON.parse(res.body)
    expect(data).toHaveProperty('metas')
    expect(Array.isArray(data.metas)).toBe(true)
  })

  test('search catalog endpoint returns metas', async () => {
    process.env.GOONHUB_PORT = '9035'
    await addon.start()

    let url =
      'http://localhost:9035/catalog/movie/goonhub-search-movie/search=test.json'
    let res = await httpGet(url)
    expect(res.statusCode).toBe(200)

    let data = JSON.parse(res.body)
    expect(data).toHaveProperty('metas')
    expect(Array.isArray(data.metas)).toBe(true)
  })

  test('manifest includes search catalogs', async () => {
    process.env.GOONHUB_PORT = '9036'
    await addon.start()

    let res = await httpGet('http://localhost:9036/manifest.json')
    let manifest = JSON.parse(res.body)
    let searchCatalogs = manifest.catalogs.filter((c) =>
      c.id.startsWith('goonhub-search-')
    )

    expect(searchCatalogs.length).toBeGreaterThan(0)
    searchCatalogs.forEach((catalog) => {
      expect(catalog.name).toBe('GoonHub Search')
      let searchExtra = catalog.extra.find((e) => e.name === 'search')
      expect(searchExtra.isRequired).toBe(true)
    })
  })

  test('meta endpoint returns meta', async () => {
    process.env.GOONHUB_PORT = '9031'
    await addon.start()

    let url =
      'http://localhost:9031/meta/movie/porn_id:TestSite-movie-1.json'
    let res = await httpGet(url)
    expect(res.statusCode).toBe(200)

    let data = JSON.parse(res.body)
    expect(data).toHaveProperty('meta')
  })

  test('stream endpoint returns streams', async () => {
    process.env.GOONHUB_PORT = '9032'
    await addon.start()

    let url =
      'http://localhost:9032/stream/movie/porn_id:TestSite-movie-1.json'
    let res = await httpGet(url)
    expect(res.statusCode).toBe(200)

    let data = JSON.parse(res.body)
    expect(data).toHaveProperty('streams')
    expect(Array.isArray(data.streams)).toBe(true)
  })

  test('/api/status returns status info', async () => {
    process.env.GOONHUB_PORT = '9033'
    await addon.start()

    let res = await httpGet('http://localhost:9033/api/status')
    expect(res.statusCode).toBe(200)

    let status = JSON.parse(res.body)
    expect(status.manifest.name).toBe('GoonHub')
  })

  test('static files are accessible', async () => {
    process.env.GOONHUB_PORT = '9034'
    await addon.start()
    let staticFiles = [
      'logo.png',
      'screenshot_discover.jpg',
      'bg.jpg',
    ]
    let promises = staticFiles.map((file) => {
      return new Promise((resolve) => {
        get(`http://localhost:9034/${file}`, resolve)
      })
    })
    let responses = await Promise.all(promises)

    responses.forEach((res) => {
      let contentType = res.headers['content-type'].split(';')[0]
      expect(contentType).not.toBe('text/html')
      expect(res.statusCode).toBe(200)
    })
  })
})
