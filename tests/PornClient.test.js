import PornClient from '../src/PornClient'


describe('PornClient', () => {
  test('returns empty array when no adapters match the request', async () => {
    let client = new PornClient({ cache: '0' })
    let request = {
      query: { type: 'unknown_type' },
      sort: { 'popularities.porn.PornHub': -1 },
    }

    let result = await client.invokeMethod('meta.find', request)

    expect(result).toEqual([])
  })

  test('returns empty array when adapter throws during catalog find', async () => {
    let client = new PornClient({ cache: '0' })

    client.adapters.forEach((adapter) => {
      adapter.find = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('API unavailable'))
      })
    })

    let request = {
      query: { type: 'movie' },
      sort: { 'popularities.porn.PornHub': -1 },
    }

    let result = await client.invokeMethod('meta.find', request)

    expect(result).toEqual([])
  })

  test('returns empty array when adapter throws during stream find', async () => {
    let client = new PornClient({ cache: '0' })

    client.adapters.forEach((adapter) => {
      adapter.getStreams = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Stream extraction failed'))
      })
    })

    let request = {
      query: {
        type: 'movie',
        porn_id: 'porn_id:PornHub-movie-abc123',
      },
    }

    let result = await client.invokeMethod('stream.find', request)

    expect(result).toEqual([])
  })

  test('returns undefined (not throw) for meta.get when adapter throws', async () => {
    let client = new PornClient({ cache: '0' })

    client.adapters.forEach((adapter) => {
      adapter.getItem = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Not found'))
      })
    })

    let request = {
      query: {
        type: 'movie',
        porn_id: 'porn_id:PornHub-movie-abc123',
      },
    }

    let result = await client.invokeMethod('meta.get', request)

    expect(result).toBeUndefined()
  })

  test('getSearchCatalogs returns search-only catalogs for each content type', () => {
    let catalogs = PornClient.getSearchCatalogs({ cache: '0' })

    expect(catalogs.length).toBeGreaterThan(0)

    catalogs.forEach((catalog) => {
      expect(catalog.id).toMatch(/^goonhub-search-/)
      expect(catalog.name).toBe('GoonHub Search')

      let searchExtra = catalog.extra.find((e) => e.name === 'search')
      expect(searchExtra).toBeTruthy()
      expect(searchExtra.isRequired).toBe(true)

      expect(catalog.extraSupported).toContain('search')
      expect(catalog.extraSupported).toContain('skip')
    })
  })

  test('getSearchCatalogs includes movie and tv types', () => {
    let catalogs = PornClient.getSearchCatalogs({ cache: '0' })
    let types = catalogs.map((c) => c.type)

    expect(types).toContain('movie')
    expect(types).toContain('tv')
  })

  test('SEARCH_CATALOG_PREFIX is defined', () => {
    expect(PornClient.SEARCH_CATALOG_PREFIX).toBe('goonhub-search-')
  })

  test('correctly routes meta.get for IDs containing dashes', async () => {
    let client = new PornClient({ cache: '0' })

    let mockItem = {
      id: 'video-abc-123',
      type: 'movie',
      name: 'Test Video',
    }

    client.adapters.forEach((adapter) => {
      adapter.getItem = jest.fn().mockImplementation((request) => {
        if (request.query.id === 'video-abc-123') {
          return Promise.resolve([mockItem])
        }
        return Promise.resolve([])
      })
    })

    let request = {
      query: {
        type: 'movie',
        porn_id: 'porn_id:PornHub-movie-video-abc-123',
      },
    }

    let result = await client.invokeMethod('meta.get', request)

    expect(result).toBeTruthy()
    expect(result.id).toContain('video-abc-123')
  })
})
