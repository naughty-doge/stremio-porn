import { URL } from 'url'
import got from 'got'
import cheerio from 'cheerio'
import AdapterBase from '../AdapterBase'


const BASE_URL = 'https://www.pornhub.com'
const SEARCH_URL = 'https://www.pornhub.com/video/search'
const MOVIE_BASE_URL = 'https://www.pornhub.com/view_video.php'
const ITEMS_PER_PAGE = 40
const ITEMS_PER_SEARCH_PAGE = 20
const SUPPORTED_TYPES = ['movie']
const REQUEST_HEADERS = {
  'user-agent': 'stremio-porn',
}


function makeMovieUrl(id) {
  return `${MOVIE_BASE_URL}?viewkey=${id}`
}

function makeEmbeddedMovieUrl(id) {
  return `${BASE_URL}/embed/${id}`
}

function viewsToNumber(views) {
  let viewsNumber = Number(views.replace(',', '').match(/^[0-9.]+/))

  if (views.includes('K')) {
    return viewsNumber * 1000
  }

  if (views.includes('M')) {
    return viewsNumber * 1000000
  }

  return viewsNumber
}

function formatDuration(seconds) {
  seconds = Number(seconds)
  let minutesString = Math.floor(seconds / 60)
  let secondsString = (`0${seconds % 60}`).slice(-2)
  return `${minutesString}:${secondsString}`
}


class PornHub extends AdapterBase {
  static SUPPORTED_TYPES = SUPPORTED_TYPES
  static ITEMS_PER_PAGE = ITEMS_PER_PAGE

  _normalizeItemResult(item) {
    return {
      type: 'movie',
      id: item.id,
      name: item.title,
      genre: item.tags,
      banner: item.image,
      poster: item.image,
      posterShape: 'landscape',
      website: item.url || makeMovieUrl(item.id),
      runtime: item.duration,
      popularity: viewsToNumber(item.views),
      isFree: true,
    }
  }

  _normalizeStreamResult(stream) {
    return {
      ...stream,
      title: 'SD',
      availability: 1,
      live: true,
      isFree: true,
    }
  }

  _extractMovies($, selector) {
    return $(selector).map((i, item) => {
      let $item = $(item)
      let id = $item.attr('_vkey')
      let title = $item.find('.title').text().trim()
      let $image = $item.find('img.thumb')
      let image = $image.attr('data-image') || $image.attr('data-mediumthumb')
      let views = $item.find('.views > var').text()
      let duration = $item.find('.duration').text()
      return { id, title, image, views, duration }
    }).toArray()
  }

  _parseMovieListPage(body) {
    let $ = cheerio.load(body)
    let selector = '.videos > li'
    return this._extractMovies($, selector)
  }

  _parseSearchPage(body) {
    let $ = cheerio.load(body)
    let selector = '.nf-videos > .sectionWrapper:first-child > .videos > li'
    return this._extractMovies($, selector)
  }

  _parseMoviePage(body) {
    let $ = cheerio.load(body)
    let title = $('meta[property="og:title"]').attr('content')
    let url = $('meta[property="og:url"]').attr('content')
    let id = new URL(url).searchParams.get('viewkey')
    let image = $('meta[property="og:image"]').attr('content')
    let tags = $('.tagsWrapper > a').map((i, link) => $(link).text()).toArray()
    let views = $('.rating-info-container > .views > .count').text()
    let duration = $('meta[property="video:duration"]').attr('content')
    duration = duration && formatDuration(duration)
    return { title, url, id, image, duration, views, tags }
  }

  _parseEmbeddedMoviePage(body) {
    /* eslint-disable max-len */
    // URL example:
    // https:\/\/de.phncdn.com\/videos\/201503\/28\/46795732\/vl_480_493k_46795732.mp4?ttl=1522227092&ri=1228800&rs=696&hash=268b5f4d76927209ef554ac9e93c6c85
    let regexp = /videoUrl"?\s*:\s*"?(https?:\\?\/\\?\/[a-z]+\.phncdn\.com[^"]+)/gi
    /* eslint-enable max-len */
    let urlMatches = regexp.exec(body)

    if (!urlMatches || !urlMatches[1]) {
      throw new Error(
        'Unable to extract a stream URL from an embedded video page'
      )
    }

    let url = urlMatches[1]
      .replace(/[\\/]+/g, '/') // Normalize the slashes...
      .replace(/(https?:\/)/, '$1/') // ...but keep the // after "https:"
    let quality = 'SD'

    return { url, quality }
  }

  _paginate(request, itemsPerPage = ITEMS_PER_SEARCH_PAGE) {
    return super._paginate(request, itemsPerPage)
  }

  async _findByPage(query, page) {
    let options = {
      headers: REQUEST_HEADERS,
      query: { page },
    }
    let { search, genre } = query
    let url

    if (!search && !genre) {
      // When nothing is specified, get the hottest videos
      url = BASE_URL
      options.query.o = 'ht'
    } else {
      url = SEARCH_URL
      options.query.search = genre ? `${genre} ${search}` : search
    }

    let { body } = await got(url, options)

    if (url === SEARCH_URL) {
      return this._parseSearchPage(body)
    } else {
      return this._parseMovieListPage(body)
    }
  }

  async _getItem(type, id) {
    let options = {
      headers: REQUEST_HEADERS,
      query: {
        viewkey: id,
      },
    }
    let { body } = await got(MOVIE_BASE_URL, options)
    return this._parseMoviePage(body)
  }

  async _getStreams(type, id) {
    let options = {
      headers: REQUEST_HEADERS,
    }
    let url = makeEmbeddedMovieUrl(id)
    let { body, statusCode } = await got(url, options)

    if (statusCode < 200 || statusCode > 299) {
      throw new Error(
        `Unable to get a stream for movie ${id} (status code ${statusCode})`
      )
    }

    let stream = this._parseEmbeddedMoviePage(body)
    return [{
      id,
      url: stream.url,
      title: stream.quality,
    }]
  }
}


export default PornHub
