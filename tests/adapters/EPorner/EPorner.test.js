import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import EPorner from '../../../src/adapters/EPorner'


const API_RESPONSE = readFileSync(`${__dirname}/apiResponse.xml`)
const MOVIE_PAGE = readFileSync(`${__dirname}/moviePage.html`)

const ITEMS = [{
  id: '6NQ6SyoGpTm',
  type: 'movie',
  streams: true,
  match: {
    name: 'Creampie After Pool Fucking',
    runtime: '21:00',
    website: 'https://www.eporner.com/hd-porn/6NQ6SyoGpTm/Creampie-After-Pool-Fucking/',
    genre: [
      'Blonde', 'Creampie', 'Cumshot', 'Hardcore', 'Pov', 'Outdoor', 'Teens',
    ],
  },
}, {
  id: '5uZP8UIKyTS',
  type: 'movie',
  streams: true,
  match: {
    name: 'Two Naked Teens',
    runtime: '8:15',
    website: 'https://www.eporner.com/hd-porn/5uZP8UIKyTS/Two-Naked-Teens/',
    genre: [
      'Blonde', 'Brunette', 'Masturbation', 'Striptease',
      'Teens', 'Small', 'Tits', 'Webcam',
    ],
  },
}]


describe('EPorner', () => {
  testAdapter(EPorner, ITEMS)

  describe('#_parseMoviePage()', () => {
    test('retrieves the item object from the sample movie page', () => {
      let adapter = new EPorner()
      let result = adapter._parseMoviePage(MOVIE_PAGE)

      expect(result).toEqual({
        _source: 'moviePage',
        title: 'Amateur Blonde With Big Boobs Takes Cock',
        url: 'https://www.eporner.com/hd-porn/byEk66VS4ez/Amateur-Blonde-With-Big-Boobs-Takes-Cock/',
        duration: '31:31',
        image: 'https://static-eu-cdn.eporner.com/thumbs/static4/1/15/154/1547921/7_240.jpg',
        tags: ['Blonde', 'Big', 'Tits', 'Cumshot', 'Hardcore', 'Pov', 'Public'],
        streams: [{
          quality: '240p',
          url: 'https://www.eporner.com/dload/byEk66VS4ez/240/1547921-240p.mp4',
        }, {
          quality: '360p',
          url: 'https://www.eporner.com/dload/byEk66VS4ez/360/1547921-360p.mp4',
        }, {
          quality: '480p',
          url: 'https://www.eporner.com/dload/byEk66VS4ez/480/1547921-480p.mp4',
        }, {
          quality: '720p',
          url: 'https://www.eporner.com/dload/byEk66VS4ez/720/1547921-720p.mp4',
        }, {
          quality: '1080p',
          url: 'https://www.eporner.com/dload/byEk66VS4ez/1080/1547921-1080p.mp4',
        }],
      })
    })
  })

  describe('#_parseApiResponse()', () => {
    test('retrieves an array of items from the sample API response', () => {
      let adapter = new EPorner()
      let results = adapter._parseApiResponse(API_RESPONSE)

      expect(results).toHaveLength(10)
      expect(results[0]).toEqual({
        id: {
          _text: '1562275',
        },
        sid: {
          _text: 'EjHSX22iLQp',
        },
        title: {
          _text: 'Teen With A Hairy Pussy Gets Pounded Hard',
        },
        keywords: {
          _text: ', teens, blonde, amateur, homemade, Teen with a hairy pussy gets pounded hard, cumshot, hardcore, lingerie',
        },
        views: {
          _text: '9236',
        },
        loc: {
          _text: 'https://www.eporner.com/hd-porn/EjHSX22iLQp/Teen-With-A-Hairy-Pussy-Gets-Pounded-Hard/',
        },
        imgthumb: {
          _text: 'https://static-eu-cdn.eporner.com/thumbs/static4/1/15/156/1562275/14.jpg',
        },
        imgthumb320x240: {
          _text: 'https://imggen.eporner.com/1562275/320/240/14.jpg',
        },
        added: {},
        added2: {},
        lenghtsec: {
          _text: '554',
        },
        lenghtmin: {
          _text: '9:14',
        },
        embed: {
          _cdata: '<iframe width="1280" height="720" src="https://www.eporner.com/embed/EjHSX22iLQp" frameborder="0" allowfullscreen></iframe>',
        },
      })
    })
  })
})
