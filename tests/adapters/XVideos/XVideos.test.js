import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import XVideos from '../../../src/adapters/XVideos'


const SAMPLE_PAGE = readFileSync(`${__dirname}/samplePage.html`, 'utf8')


describe('XVideos', () => {
  testAdapter(XVideos)

  describe('#_parseSearchResults()', () => {
    test('parses search results from a sample page', () => {
      let adapter = new XVideos()
      let results = adapter._parseSearchResults(SAMPLE_PAGE)

      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        id: 'video12345',
        name: 'First Test Video',
      })
      expect(results[1]).toMatchObject({
        id: 'video67890',
        name: 'Second Test Video',
      })
    })
  })

  describe('#_extractStreamsFromPage()', () => {
    test('extracts streams from a sample video page', () => {
      let adapter = new XVideos()
      let streams = adapter._extractStreamsFromPage(SAMPLE_PAGE)

      expect(streams).toHaveLength(3)
      expect(streams[0]).toMatchObject({ quality: 'HLS' })
      expect(streams[0].url).toContain('m3u8')
      expect(streams[1]).toMatchObject({ quality: 'High' })
      expect(streams[1].url).toContain('test_high.mp4')
      expect(streams[2]).toMatchObject({ quality: 'Low' })
      expect(streams[2].url).toContain('test_low.mp4')
    })
  })

  describe('#_extractMetadataFromPage()', () => {
    test('extracts metadata from a sample video page', () => {
      let adapter = new XVideos()
      let meta = adapter._extractMetadataFromPage(SAMPLE_PAGE)

      expect(meta.name).toBe('Test Video')
      expect(meta.poster).toContain('thumbs169poster/test.jpg')
      expect(meta.pageUrl).toBe('https://www.xvideos.com/video12345/test_video')
      expect(meta.description).toBe('Watch Test Video on XVIDEOS for free')
      expect(meta.tags).toEqual(['amateur', 'blonde', 'pov'])
      expect(meta.duration).toBe('630')
      expect(meta.year).toBe(2023)
    })

    test('returns empty arrays and strings for missing metadata', () => {
      let adapter = new XVideos()
      let meta = adapter._extractMetadataFromPage('<html><head></head><body></body></html>')

      expect(meta.name).toBe('')
      expect(meta.poster).toBe('')
      expect(meta.tags).toEqual([])
      expect(meta.duration).toBe('')
      expect(meta.year).toBe('')
    })
  })
})
