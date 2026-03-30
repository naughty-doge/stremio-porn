import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import XHamster from '../../../src/adapters/XHamster'


const SAMPLE_PAGE = readFileSync(`${__dirname}/samplePage.html`, 'utf8')


describe('XHamster', () => {
  testAdapter(XHamster)

  describe('#_parseSearchResults()', () => {
    test('parses search results from a sample page', () => {
      let adapter = new XHamster()
      let results = adapter._parseSearchResults(SAMPLE_PAGE)

      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        id: '12345',
        name: 'First xHamster Video',
      })
      expect(results[1]).toMatchObject({
        id: '67890',
        name: 'Second xHamster Video',
      })
    })
  })

  describe('#_extractStreamsFromPage()', () => {
    test('extracts streams from a sample video page', () => {
      let adapter = new XHamster()
      let streams = adapter._extractStreamsFromPage(SAMPLE_PAGE)

      expect(streams).toHaveLength(2)
      let qualities = streams.map((s) => s.quality).sort()
      expect(qualities).toEqual(['480', '720'])
      let stream720 = streams.find((s) => s.quality === '720')
      let stream480 = streams.find((s) => s.quality === '480')
      expect(stream720.url).toContain('720p.mp4')
      expect(stream480.url).toContain('480p.mp4')
    })
  })

  describe('#_extractMetadataFromPage()', () => {
    test('extracts metadata from a sample video page', () => {
      let adapter = new XHamster()
      let meta = adapter._extractMetadataFromPage(SAMPLE_PAGE)

      expect(meta.name).toBe('Test xHamster Video')
      expect(meta.poster).toContain('poster.jpg')
      expect(meta.pageUrl).toBe('https://xhamster.com/videos/test-video-12345')
      expect(meta.description).toBe('Watch Test xHamster Video on xHamster')
      expect(meta.tags).toEqual(['milf', 'brunette', 'hardcore'])
      expect(meta.duration).toBe('630')
      expect(meta.year).toBe(2023)
    })

    test('returns empty arrays and strings for missing metadata', () => {
      let adapter = new XHamster()
      let meta = adapter._extractMetadataFromPage('<html><head></head><body></body></html>')

      expect(meta.name).toBe('')
      expect(meta.poster).toBe('')
      expect(meta.tags).toEqual([])
      expect(meta.duration).toBe('')
      expect(meta.year).toBe('')
    })
  })
})
