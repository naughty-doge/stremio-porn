import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import SpankWire from '../../../src/adapters/SpankWire'


const EMBED_PAGE = readFileSync(`${__dirname}/embeddedMoviePage.html`, 'utf8')

const ITEMS = [{
  id: '16838912',
  type: 'movie',
  streams: true,
  match: {
    name: 'Pervert hd first time Did you ever wonder what happens when a red-hot',
  },
}, {
  id: '9423892',
  type: 'movie',
  streams: true,
  match: {
    name: 'BDSM and Bondage teen slave fucked by master domination',
  },
}]


describe('SpankWire', () => {
  testAdapter(SpankWire, ITEMS)

  describe('#_extractStreamsFromEmbed()', () => {
    test('retrieves a stream from a sample embedded movie page', () => {
      let adapter = new SpankWire()
      let results = adapter._extractStreamsFromEmbed(EMBED_PAGE)

      expect(results).toEqual([{
        quality: 'Normal',
        url: 'https://cdn1-embed-extremetube.spankcdn.net/media//201804/29/24260991/mp4_normal_24260991.mp4?validfrom=1524996113&validto=1525003313&rate=34k&burst=2000k&hash=d3lzXN0Tx0e9%2BId7wp%2Bf1T8Momo%3D',
      }, {
        quality: 'High',
        url: 'https://cdn1-embed-extremetube.spankcdn.net/media//201804/29/24260991/mp4_high_24260991.mp4?validfrom=1524996113&validto=1525003313&rate=43k&burst=2000k&hash=%2FjtfI%2FozorkRmIENVbnsoN2m29c%3D',
      }, {
        quality: 'Ultra',
        url: 'https://cdn1-embed-extremetube.spankcdn.net/media//201804/29/24260991/mp4_ultra_24260991.mp4?validfrom=1524996113&validto=1525003313&rate=65k&burst=2000k&hash=qmx%2BLwYFc3pQRjYmeCKSlNP5ho4%3D',
      }, {
        quality: '720p',
        url: 'https://cdn1-embed-extremetube.spankcdn.net/media//201804/29/24260991/mp4_720p_24260991.mp4?validfrom=1524996113&validto=1525003313&rate=141k&burst=2000k&hash=8lag09lM%2BHc%2F%2Frgi4Kcc6gObcr4%3D',
      }])
    })
  })
})
