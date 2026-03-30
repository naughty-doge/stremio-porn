import DebridClient from '../src/DebridClient'


describe('DebridClient', () => {
  test('returns the original streams when disabled', async () => {
    let mockHttpClient = { request: jest.fn() }
    let debridClient = new DebridClient(mockHttpClient)

    let streams = [{ url: 'http://example.com/file.mp4' }]
    let result = await debridClient.unrestrictStreams(streams)

    expect(result).toEqual(streams)
    expect(mockHttpClient.request).not.toHaveBeenCalled()
  })

  test('returns HTTP streams as-is when user chooses no debrid service', async () => {
    let mockHttpClient = { request: jest.fn() }
    let debridClient = new DebridClient(mockHttpClient, {})

    expect(debridClient.isEnabled).toBe(false)

    let streams = [
      { url: 'https://cdn.example.com/video1.mp4', name: 'Source A' },
      { url: 'https://cdn.example.com/video2.mp4', name: 'Source B' },
    ]
    let result = await debridClient.unrestrictStreams(streams)

    expect(result).toEqual(streams)
    expect(mockHttpClient.request).not.toHaveBeenCalled()
  })

  test('uses Real-Debrid when a token is provided', async () => {
    let mockHttpClient = {
      request: jest.fn().mockResolvedValue({
        body: { download: 'https://real-debrid.test/direct.mp4' },
      }),
    }
    let debridClient = new DebridClient(mockHttpClient, { realDebridToken: 'token' })

    let [stream] = await debridClient.unrestrictStreams([{ url: 'http://example.com/video' }])

    expect(mockHttpClient.request).toHaveBeenCalledWith(
      'https://api.real-debrid.com/rest/1.0/unrestrict/link',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      })
    )
    expect(stream.url).toBe('https://real-debrid.test/direct.mp4')
    expect(stream.name).toBe('Debrid')
  })

  test('does not fall back to Torbox when Real-Debrid fails', async () => {
    let mockHttpClient = {
      request: jest.fn((url) => {
        if (url.includes('real-debrid')) {
          return Promise.reject(new Error('rd unavailable'))
        }
        return Promise.resolve({ body: { link: 'https://torbox.test/direct.mp4' } })
      }),
    }
    let debridClient = new DebridClient(mockHttpClient, {
      realDebridToken: 'token',
      torboxToken: 'tor-token',
    })

    let [stream] = await debridClient.unrestrictStreams([{ url: 'http://example.com/video2' }])

    // Only Real-Debrid should be called since realDebridToken is set
    expect(mockHttpClient.request).toHaveBeenCalledTimes(1)
    expect(mockHttpClient.request.mock.calls[0][0]).toContain('real-debrid')
    // Original URL kept because Real-Debrid failed and no fallback
    expect(stream.url).toBe('http://example.com/video2')
  })

  test('uses Torbox when only torboxToken is provided', async () => {
    let mockHttpClient = {
      request: jest.fn((url) => {
        if (url.includes('checkcached')) {
          return Promise.resolve({ body: { data: { cached: true } } })
        }
        return Promise.resolve({ body: { link: 'https://torbox.test/direct.mp4' } })
      }),
    }
    let debridClient = new DebridClient(mockHttpClient, { torboxToken: 'tor-token' })

    let [stream] = await debridClient.unrestrictStreams([{ url: 'http://example.com/video' }])

    expect(stream.url).toBe('https://torbox.test/direct.mp4')
    let rdCalls = mockHttpClient.request.mock.calls.filter(
      (call) => call[0].includes('real-debrid')
    )
    expect(rdCalls).toHaveLength(0)
  })

  test('skips Torbox unrestrict when cache check returns not cached', async () => {
    let mockHttpClient = {
      request: jest.fn((url) => {
        if (url.includes('checkcached')) {
          return Promise.resolve({ body: { data: { cached: false } } })
        }
        return Promise.resolve({ body: {} })
      }),
    }
    let debridClient = new DebridClient(mockHttpClient, { torboxToken: 'tor-token' })

    let [stream] = await debridClient.unrestrictStreams([{ url: 'http://example.com/video' }])

    expect(stream.url).toBe('http://example.com/video')
    let unrestrictCalls = mockHttpClient.request.mock.calls.filter(
      (call) => call[0].includes('links/instant')
    )
    expect(unrestrictCalls).toHaveLength(0)
  })

  test('proceeds with Torbox unrestrict when cache check fails', async () => {
    let mockHttpClient = {
      request: jest.fn((url) => {
        if (url.includes('checkcached')) {
          return Promise.reject(new Error('network error'))
        }
        return Promise.resolve({ body: { link: 'https://torbox.test/direct.mp4' } })
      }),
    }
    let debridClient = new DebridClient(mockHttpClient, { torboxToken: 'tor-token' })

    let [stream] = await debridClient.unrestrictStreams([{ url: 'http://example.com/video' }])

    expect(stream.url).toBe('https://torbox.test/direct.mp4')
  })
})
