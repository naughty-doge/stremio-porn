import { readFileSync } from 'fs'
import testAdapter from '../testAdapter'
import PornHub from '../../../src/adapters/PornHub'


const MOVIE_LIST_PAGE = readFileSync(`${__dirname}/movieListPage.html`)
const SEARCH_PAGE = readFileSync(`${__dirname}/searchPage.html`)
const MOVIE_PAGE = readFileSync(`${__dirname}/moviePage.html`)
const EMBEDDED_MOVIE_PAGE = readFileSync(`${__dirname}/embeddedMoviePage.html`)

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

  describe('#_parseMoviePage()', () => {
    test('retrieves the item object from the sample movie page', () => {
      let adapter = new PornHub()
      let result = adapter._parseMoviePage(MOVIE_PAGE)

      expect(result).toEqual({
        id: 'ph5aa12b2401ac4',
        url: 'https://www.pornhub.com/view_video.php?viewkey=ph5aa12b2401ac4',
        title: 'Sucking and fucking on the couch (Facial)',
        duration: '497',
        views: '1,627,577',
        image: 'https://bi.phncdn.com/videos/201803/08/157338061/original/(m=eGcEGgaaaa)(mh=2jW2n93BDKx8OuSY)10.jpg',
        tags: [
          'big cock', 'petite', 'teenager', 'young', 'big', 'ass', 'pawg', 'miss banana', 'facial',
          'cum on face', 'swedish', 'couple', 'leggings', 'braids', 'blowjob', 'sucking dick',
        ],
      })
    })
  })

  describe('#_parseMovieListPage()', () => {
    test('retrieves an array of movies from the sample list page', () => {
      let adapter = new PornHub()
      let results = adapter._parseMovieListPage(MOVIE_LIST_PAGE)

      expect(results).toHaveLength(40)
      expect(results[0]).toEqual({
        id: 'ph591c49b831236',
        title: 'BANGBROS - PAWG Alexis Texas Has a Fat and Juicy White Ass (ap9719)',
        image: 'https://bi.phncdn.com/videos/201705/17/116792261/original/(m=ecuKGgaaaa)(mh=8FbIp-FeeUJsWqVU)2.jpg',
        views: '11.5M',
      })
    })
  })

  describe('#_parseSearchPage()', () => {
    test('retrieves an array of movies from the sample search page', () => {
      let adapter = new PornHub()
      let results = adapter._parseSearchPage(SEARCH_PAGE)

      expect(results).toHaveLength(20)
      expect(results[0]).toEqual({
        id: 'ph56486c25a82f2',
        title: 'deep throating and face fucking compilation - fshow',
        image: 'https://bi.phncdn.com/videos/201511/15/61670831/original/(m=ecuKGgaaaa)(mh=0RaAOd1Mk9iJsQ8o)3.jpg',
        views: '2.4M',
      })
      results.forEach((result) => {
        expect(result.id).toBeTruthy()
      })
    })
  })

  describe('#_parseEmbeddedMoviePage()', () => {
    test('retrieves a stream from a sample embedded movie page', () => {
      let adapter = new PornHub()
      let result = adapter._parseEmbeddedMoviePage(EMBEDDED_MOVIE_PAGE)

      expect(result).toEqual({
        quality: 'SD',
        url: 'https://de.phncdn.com/videos/201503/28/46795732/vl_480_493k_46795732.mp4?ttl=1522227092&ri=1228800&rs=696&hash=268b5f4d76927209ef554ac9e93c6c85',
      })
    })
  })
})
