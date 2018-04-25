/* eslint-disable camelcase */

import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import PornCom from '../../../src/adapters/PornCom'


const API_RESPONSE = readFileSync(`${__dirname}/apiResponse.xml`).toString()
const EMBED_PAGE = readFileSync(`${__dirname}/embedPage.xml`).toString()

const ITEMS = [{
  id: '4163325',
  type: 'movie',
  streams: true,
  match: {
    name: 'TS Casey Kisses threesome with lesbians',
    runtime: '5:40',
    website: 'https://www.porn.com/videos/ts-casey-kisses-threesome-with-lesbians-4163325',
    genre: [
      'Amateur', 'Anal Sex', 'Couples', 'Hardcore', 'HD', 'Licking', 'Pussy Licking',
      'Reverse Cowgirl', 'Straight', 'Strap-On', 'White Female',
    ],
  },
}, {
  id: '2212517',
  type: 'movie',
  streams: true,
  match: {
    name: 'Cameraman shoves huge cock in agent',
    runtime: '10:04',
    website: 'https://www.porn.com/videos/cameraman-shoves-huge-cock-in-agent-2212517',
    genre: [
      'Amateur', 'Ass Spreading', 'Beautiful', 'Big Cock', 'Blowjob', 'Bra',
      'Brunette', 'Casting', 'College', 'Couch', 'Couples', 'Czech', 'Deep Throat',
      'Doggy Style', 'Dress', 'Euro', 'Fingering', 'HD', 'Hardcore', 'High Heels',
      'Masturbation', 'Office', 'POV', 'Panties - Other', 'Pussy Fingering',
      'Pussy Masturbation', 'Pussy Spreading', 'Reality', 'Shaved Pussy', 'Skinny',
      'Small Tits', 'Straight', 'Strap-On', 'Sucking', 'Toys', 'Vaginal Toys',
      'Voyeur', 'White Female', 'White Male',
    ],
  },
}]


describe('PornCom', () => {
  testAdapter(PornCom, ITEMS)

  describe('#_extractQualitiesFromEmbedPage()', () => {
    test('retrieves an array of quality strings from the sample embed page', () => {
      let adapter = new PornCom()
      let results = adapter._extractQualitiesFromEmbedPage(EMBED_PAGE)

      expect(results).toEqual(['144', '240'])
    })
  })

  describe('#_parseApiResponse()', () => {
    test('retrieves an array of items from the sample API response', () => {
      let adapter = new PornCom()
      let results = adapter._parseApiResponse(API_RESPONSE)

      expect(results).toHaveLength(70)
      expect(results[0]).toEqual({
        id: 4451515,
        url: 'https://www.porn.com/videos/homemade-anal-party-milf-ass-treatment-4451515',
        active_date: '2018-04-11 13:04:55',
        thumb: 'https://i-e-cdn.porn.com/sc/4/4451/4451515/promo/crop/380x222/promo_3.jpg',
        title: 'Homemade anal : party Milf ass treatment',
        duration: 389,
        views: 0,
        ratings: 0,
        rating: 0,
        channel: null,
        actors: [],
        tags: [
          'Anal', 'Ass Fingering', 'Ass Spreading', 'Blonde', 'Couples', 'Fingering',
          'Hardcore', 'Homemade', 'Oil / Lotion', 'POV', 'Panties - Other',
          'Small Cocks', 'Straight', 'White Female', 'White Male',
        ],
        embed_url: 'https://www.porn.com/videos/embed/4451515',
        embed_html: '<iframe scrolling="no" width="600" height="371" src="https://www.porn.com/videos/embed/4451515" frameborder="0"></iframe>',
      })
    })
  })
})
