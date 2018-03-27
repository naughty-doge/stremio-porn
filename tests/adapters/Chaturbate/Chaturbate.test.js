import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import Chaturbate from '../../../src/adapters/Chaturbate'


const LIST_PAGE = readFileSync(`${__dirname}/listPage.html`)
const ITEM_PAGE = readFileSync(`${__dirname}/itemPage.html`)


const items = [{
  id: 'minksky',
  type: 'tv',
  name: 'minksky',
}, {
  id: 'fuckable_18',
  type: 'tv',
  name: 'fuckable_18',
}]


describe('Chaturbate', () => {
  testAdapter(Chaturbate, items)

  describe('#_parseItemPage()', () => {
    test('retrieves the item object from the sample item page', () => {
      let adapter = new Chaturbate()
      let result = adapter._parseItemPage(ITEM_PAGE)

      expect(result).toEqual({
        id: 'fuckable_18',
        url: 'https://chaturbate.com/fuckable_18/',
        subject: 'Hornyy girls🔥 #lovense ON, help us  #cum #squir@ 3goals squirt t // #ohmibod #teen #horny #cum #cream £natural #ohmibod #interactivetoy',
        poster: 'https://roomimg.stream.highwebmedia.com/ri/fuckable_18.jpg',
        tags: ['lovense', 'cum', 'squir@', 'ohmibod', 'teen', 'horny', 'cum', 'cream', 'ohmibod', 'interactivetoy'],
      })
    })
  })

  describe('#_parseListPage()', () => {
    test('retrieves an array of items from the sample list page', () => {
      let adapter = new Chaturbate()
      let results = adapter._parseListPage(LIST_PAGE)

      expect(results).toHaveLength(72)
      expect(results[0]).toEqual({
        id: 'melaniebiche',
        url: 'https://chaturbate.com/melaniebiche/',
        subject: 'lovense: interactive toy that vibrates with your tips #lovense #ohmibod #interactivetoy #french #hairy #bigass #bbw #bigboobs #bigass #spanish #curvy #natural #aussie',
        poster: 'https://roomimg.stream.highwebmedia.com/ri/melaniebiche.jpg?1522108230',
        tags: ['lovense', 'ohmibod', 'interactivetoy', 'french', 'hairy', 'bigass', 'bbw', 'bigboobs', 'bigass', 'spanish', 'curvy', 'natural', 'aussie'],
        viewers: 361,
      })
    })
  })
})
