import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import RedTube from '../../../src/adapters/RedTube'


const EMBED_PAGE = readFileSync(`${__dirname}/embeddedVideoPage.html`)

const ITEMS = [{
  id: 1,
  type: 'movie',
  streams: ['201208/31/1/480p_600k_1.mp4'],
  match: {
    name: 'Heather taking it deep again',
  },
}, {
  id: 4848071,
  type: 'movie',
  streams: ['201803/08/4848071/480P_600K_4848071.mp4'],
  match: {
    name: 'Brother Caught Redhead Step-Sister Masturbate and Fuck Anal',
  },
}]


describe('RedTube', () => {
  testAdapter(RedTube, ITEMS)

  describe('#_extractStreamsFromEmbed()', () => {
    test('retrieves a stream from a sample embedded video page', () => {
      let adapter = new RedTube()
      let result = adapter._extractStreamsFromEmbed(EMBED_PAGE)

      expect(result).toEqual([{
        url: 'https://ce.rdtcdn.com/media/videos/201803/08/4848071/480P_600K_4848071.mp4?a5dcae8e1adc0bdaed975f0d66fb5e0568d9f5b553250a40db6040349e33a09c6fe9df21d2172658c3212e4a12a1aa10d7abea9c9e32593783053be05a3d5ee05e116588562463e0e6234de008e847b568c7c15d714814801dc24012fb8cf118017f49853398246c7335d1d54773a963ab867f31244ca5ba17067b7bae',
      }])
    })
  })
})
