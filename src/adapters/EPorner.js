import { xml2js } from 'xml-js'
import cheerio from 'cheerio'
import BaseAdapter from './BaseAdapter'


const BASE_URL = 'https://www.eporner.com'
const ITEMS_PER_PAGE = 60
const SUPPORTED_TYPES = ['movie']


class EPorner extends BaseAdapter {
  static SUPPORTED_TYPES = SUPPORTED_TYPES
  static ITEMS_PER_PAGE = ITEMS_PER_PAGE

  _normalizePageItem(item) {
    let id = item.url.split('/')[4]
    let duration = item.duration && item.duration
      .replace('M', ':')
      .replace(/[TS]/gi, '')

    return {
      type: 'movie',
      id: id,
      name: item.title,
      genre: item.tags,
      banner: item.image,
      poster: item.image,
      posterShape: 'landscape',
      website: item.url,
      description: item.url,
      runtime: duration,
      isFree: 1,
    }
  }

  _normalizeApiItem(item) {
    let tags = item.keywords && item.keywords._text
      .split(',')
      .slice(1)
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.split(' ').length < 3)

    return {
      type: 'movie',
      id: item.sid ? item.sid._text : item.id._text,
      name: item.title._text,
      genre: tags,
      banner: item.imgthumb._text,
      poster: item['imgthumb320x240']._text,
      posterShape: 'landscape',
      website: item.loc._text,
      description: item.loc._text,
      runtime: item.lenghtmin._text,
      popularity: Number(item.views._text || 0),
      isFree: 1,
    }
  }

  _normalizeItem(item) {
    if (item._source === 'moviePage') {
      item = this._normalizePageItem(item)
    } else {
      item = this._normalizeApiItem(item)
    }

    return super._normalizeItem(item)
  }

  _normalizeStream(stream) {
    return super._normalizeStream({
      id: stream.id,
      url: stream.url,
      title: stream.quality,
      availability: 1,
      live: true,
      isFree: true,
    })
  }

  _makeApiUrl(query, skip, limit) {
    let { search, genre } = query
    let keywords

    if (search && genre) {
      keywords = `${genre},${search}`
    } else {
      keywords = search || genre || 'all'
    }

    keywords = keywords.replace(' ', '+')
    return `${BASE_URL}/api_xml/${keywords}/${limit}/${skip}/adddate`
  }

  _makeMovieUrl(id) {
    return `${BASE_URL}/hd-porn/${id}`
  }

  _makeFullStreamUrl(path) {
    return BASE_URL + path
  }

  _parseApiResponse(xml) {
    let results = xml2js(xml, {
      compact: true,
      trim: true,
    })['eporner-data'].movie

    if (!results) {
      return []
    } else if (!Array.isArray(results)) {
      return [results]
    } else {
      return results
    }
  }

  _parseMoviePage(body) {
    let $ = cheerio.load(body)
    let title = $('meta[property="og:title"]')
      .attr('content')
      .replace(/(\s*-\s*)?EPORNER/i, '')
    let description = $('meta[property="og:description"]').attr('content')
    let duration = description.match(/duration:\s*((:?\d)+)/i)[1]
    let url = $('meta[property="og:url"]').attr('content')
    let image = $('meta[property="og:image"]').attr('content')
    let tags = $('#hd-porn-tags td')
      .filter((i, item) => $(item).text().trim() === 'Tags:')
      .next()
      .find('a')
      .map((i, item) => $(item).text().trim())
      .toArray()
    let streams = $('#hd-porn-dload a')
      .map((i, el) => {
        let streamUrlPath = $(el).attr('href')
        let quality = `${streamUrlPath.split('/')[3]}p`
        let url = this._makeFullStreamUrl(streamUrlPath)
        return { quality, url }
      })
      .toArray()

    return {
      _source: 'moviePage',
      title, url, image, tags, duration, streams,
    }
  }

  async _find(query, { skip, limit }) {
    let url = this._makeApiUrl(query, skip, limit)
    let { body } = await this.httpClient.request(url)
    return this._parseApiResponse(body)
  }

  async _getItem(type, id) {
    let url = this._makeMovieUrl(id)
    let { body } = await this.httpClient.request(url)
    return this._parseMoviePage(body)
  }

  async _getStreams(type, id) {
    let url = this._makeMovieUrl(id)
    let { body } = await this.httpClient.request(url)
    let { streams } = this._parseMoviePage(body)
    return streams.map((stream) => {
      stream.id = id
      return stream
    })
  }
}


export default EPorner
