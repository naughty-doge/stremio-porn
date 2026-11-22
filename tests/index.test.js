/* eslint-disable no-console */

import { get } from 'http'


jest.mock('../src/PornClient', () => {
  const Actual = jest.requireActual('../src/PornClient').default
  class MockPornClient extends Actual {}
  MockPornClient.prototype.invokeMethod = jest.fn()
  return { __esModule: true, default: MockPornClient }
})

// Prevent the addon from printing
// eslint-disable-next-line no-unused-vars
let log = console.log
console.log = () => {}
console.error = () => {}

function reset() {
  jest.resetModules()

  delete process.env.STREMIO_PORN_ID
  delete process.env.STREMIO_PORN_ENDPOINT
  delete process.env.STREMIO_PORN_PORT
  delete process.env.STREMIO_PORN_PROXY
  delete process.env.STREMIO_PORN_CACHE
  delete process.env.STREMIO_PORN_EMAIL
  delete process.env.NODE_ENV
}

function initAddon() {
  return {
    start() {
      // eslint-disable-next-line global-require
      this.server = require('../src/index').default

      // In case an error occurs before the server starts (e.g. port is in use),
      // it silently fails and the tests stall
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

function request(path) {
  return new Promise((resolve, reject) => {
    // agent: false — keep-alive sockets would block server.close()
    get(`http://localhost${path}`, { agent: false }, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body })
      })
    }).on('error', reject)
  })
}

function requestJson(path) {
  return request(path).then((res) => {
    return { ...res, json: JSON.parse(res.body) }
  })
}

describe('Addon @integration', () => {
  let addon
  let PornClient

  beforeEach(() => {
    reset()
    // Require the mock from the fresh module registry, so it's the same class
    // that src/index will get when it's required in start()
    // eslint-disable-next-line global-require
    PornClient = require('../src/PornClient').default
    PornClient.prototype.invokeMethod.mockReset()
    addon = initAddon()
  })

  afterEach(() => {
    return addon.stop()
  })

  test('When a port is not specified, starts a web server on port 80', async () => {
    await addon.start()
    expect(addon.server.address().port).toBe(80)
  })

  test('When a port is specified, starts a web server on it', async () => {
    process.env.STREMIO_PORN_PORT = '9028'
    await addon.start()
    expect(addon.server.address().port).toBe(9028)
  })

  test('The manifest is served as JSON', async () => {
    await addon.start()
    let res = await requestJson('/manifest.json')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch('application/json')
    expect(res.json.id).toBe('stremio_porn')
    expect(res.json.resources).toEqual(['catalog', 'meta', 'stream'])
    expect(res.json.catalogs).toHaveLength(6)
  })

  test('catalog returns metas', async () => {
    PornClient.prototype.invokeMethod.mockResolvedValue([
      {
        id: 'porn_id:PornHub-movie-1',
        type: 'movie',
        name: 'Test video',
        poster: 'http://example.com/poster.jpg',
        genre: ['tag'],
      },
    ])
    await addon.start()
    let res = await requestJson('/catalog/movie/PornHub.json')
    expect(res.status).toBe(200)
    expect(res.json.metas[0].id).toBe('porn_id:PornHub-movie-1')
    expect(res.json.metas[0].name).toBe('Test video')
    expect(res.json.metas[0].genres).toEqual(['tag'])

    let [method, req] = PornClient.prototype.invokeMethod.mock.calls[0]
    expect(method).toBe('meta.find')
    expect(req.sort).toEqual({ 'popularities.porn.PornHub': -1 })
  })

  test('catalog parses extra parameters', async () => {
    PornClient.prototype.invokeMethod.mockResolvedValue([])
    await addon.start()
    let extra = encodeURIComponent('search=foo bar&skip=30')
    let res = await requestJson(`/catalog/movie/PornHub/${extra}.json`)
    expect(res.status).toBe(200)

    let [, req] = PornClient.prototype.invokeMethod.mock.calls[0]
    expect(req.query.search).toBe('foo bar')
    expect(req.skip).toBe(30)
  })

  test('unknown catalog returns 404', async () => {
    await addon.start()
    let res = await requestJson('/catalog/movie/DoesNotExist.json')
    expect(res.status).toBe(404)
  })

  test('meta is served for an id', async () => {
    PornClient.prototype.invokeMethod.mockResolvedValue({
      id: 'porn_id:PornHub-movie-1',
      type: 'movie',
      name: 'Test video',
    })
    await addon.start()
    let id = encodeURIComponent('porn_id:PornHub-movie-1')
    let res = await requestJson(`/meta/movie/${id}.json`)
    expect(res.status).toBe(200)
    expect(res.json.meta.name).toBe('Test video')

    let [method, req] = PornClient.prototype.invokeMethod.mock.calls[0]
    expect(method).toBe('meta.get')
    expect(req.query.porn_id).toBe('porn_id:PornHub-movie-1')
  })

  test('streams are served for an id', async () => {
    PornClient.prototype.invokeMethod.mockResolvedValue([
      { name: 'PornHub', title: 'HD', url: 'http://example.com/video.mp4' },
    ])
    await addon.start()
    let id = encodeURIComponent('porn_id:PornHub-movie-1')
    let res = await requestJson(`/stream/movie/${id}.json`)
    expect(res.status).toBe(200)
    expect(res.json.streams[0].url).toBe('http://example.com/video.mp4')

    let [method] = PornClient.prototype.invokeMethod.mock.calls[0]
    expect(method).toBe('stream.find')
  })

  test('The main page is accessible', async () => {
    await addon.start()
    let res = await request('/')
    expect(res.statusCode || res.status).toBe(200)
  })

  test('The static files are accessible', async () => {
    await addon.start()
    let staticFiles = [
      'logo.png',
      'screenshot_discover.jpg',
      'bg.jpg',
    ]
    let responses = await Promise.all(staticFiles.map((file) => {
      return request(`/${file}`)
    }))

    responses.forEach((res) => {
      let contentType = res.headers['content-type'].split(';')[0]
      expect(contentType).not.toBe('text/html')
      expect(res.status).toBe(200)
    })
  })
})
