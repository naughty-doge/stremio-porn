import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import YouPorn from '../../../src/adapters/YouPorn'


const EMBED_PAGE = readFileSync(`${__dirname}/embeddedMoviePage.html`, 'utf8')

const ITEMS = [{
  id: '11822513',
  type: 'movie',
  streams: true,
  match: {
    name: 'Hot brunette gang bang party',
  },
}, {
  id: '13745019',
  type: 'movie',
  streams: true,
  match: {
    name: 'Teenage Shoplifter Sucks Cock To Avoid Arrest Outrageous Footage',
  },
}]


describe('YouPorn', () => {
  testAdapter(YouPorn, ITEMS)

  describe('#_extractStreamsFromEmbed()', () => {
    test('retrieves a stream from a sample embedded movie page', () => {
      let adapter = new YouPorn()
      let results = adapter._extractStreamsFromEmbed(EMBED_PAGE)

      expect(results).toEqual([{
        quality: '720p',
        url: 'https://ee.ypncdn.com/201709/01/14062051/720p_1500k_14062051/YouPorn_-_mia-khalifa-big-tits-arab-pornstar-takes-a-fan-s-virginity.mp4?rate=193k&burst=1400k&validfrom=1524765800&validto=1524780200&hash=EGRxkAOZwod648gfnITHeyb%2Fzi8%3D',
      }, {
        quality: '480p',
        url: 'https://ee.ypncdn.com/201709/01/14062051/480p_750k_14062051/YouPorn_-_mia-khalifa-big-tits-arab-pornstar-takes-a-fan-s-virginity.mp4?rate=118k&burst=1400k&validfrom=1524765800&validto=1524780200&hash=BPhhTG9iIKFHlZHVJWQtGUuyk9I%3D',
      }, {
        quality: '240p',
        url: 'https://ee.ypncdn.com/201709/01/14062051/240p_240k_14062051/YouPorn_-_mia-khalifa-big-tits-arab-pornstar-takes-a-fan-s-virginity.mp4?rate=59k&burst=1400k&validfrom=1524765800&validto=1524780200&hash=gAETeLQVKHf3uNn3%2FzgV0qv%2BcI0%3D',
      }])
    })
  })
})
