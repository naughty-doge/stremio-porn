import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import PornHub from '../../../src/adapters/PornHub'


const EMBED_PAGE = readFileSync(`${__dirname}/embeddedMoviePage.html`, 'utf8')

const ITEMS = [{
  id: 'ph598cafd0ca22e',
  type: 'movie',
  streams: ['201708/10/128079091'],
  match: {
    name: 'Amateur Girl Fucked With Cum On Face / Fucked After Facial',
  },
}, {
  id: 'ph5a94a343e79fe',
  type: 'movie',
  streams: ['201802/27/156159022'],
  match: {
    name: 'POV edging blowjob tongue part 2',
  },
}]


describe('PornHub', () => {
  testAdapter(PornHub, ITEMS)

  describe('#_extractStreamsFromEmbed()', () => {
    test('retrieves a stream from a sample embedded movie page', () => {
      let adapter = new PornHub()
      let result = adapter._extractStreamsFromEmbed(EMBED_PAGE)

      expect(result).toEqual([{
        url: 'https://de.phncdn.com/videos/201503/28/46795732/vl_480_493k_46795732.mp4?ttl=1522227092&ri=1228800&rs=696&hash=268b5f4d76927209ef554ac9e93c6c85',
      }])
    })
  })
})
