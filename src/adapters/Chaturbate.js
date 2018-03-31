import got from 'got'
import cheerio from 'cheerio'
import AdapterBase from '../AdapterBase'


const BASE_URL = 'https://chaturbate.com'
const GET_STREAM_URL = 'https://chaturbate.com/get_edge_hls_url_ajax/'
const ITEMS_PER_PAGE = 72
const SUPPORTED_TYPES = ['tv']
const REQUEST_HEADERS = {
  'user-agent': 'stremio-porn',
}


class Chaturbate extends AdapterBase {
  static SUPPORTED_TYPES = SUPPORTED_TYPES
  static ITEMS_PER_PAGE = ITEMS_PER_PAGE

  _normalizeItemResult(item) {
    return {
      type: 'tv',
      id: item.id,
      name: item.id,
      genre: item.tags,
      banner: item.poster,
      poster: item.poster,
      posterShape: 'landscape',
      website: item.url,
      description: item.subject,
      popularity: item.viewers,
      isFree: true,
    }
  }

  _normalizeStreamResult(stream) {
    return {
      ...stream,
      title: 'Watch',
      availability: 1,
      live: true,
      isFree: true,
    }
  }

  _parseListPage(body) {
    let $ = cheerio.load(body)
    let tagRegexp = /#\S+/g
    return $('.list > li').map((i, item) => {
      let $item = $(item)
      let $link = $item.find('.title > a')
      let id = $link.text().trim()
      let url = BASE_URL + $link.attr('href')
      let subject = $item.find('.subject').text().trim()
      let tags = (subject.match(tagRegexp) || []).map((tag) => tag.slice(1))
      let poster = $item.find('img').attr('src')
      let viewers = $item.find('.cams').text().match(/(\d+) viewers/i)
      viewers = viewers && Number(viewers[1])
      return { id, url, subject, poster, tags, viewers }
    }).toArray()
  }

  _parseItemPage(body) {
    let $ = cheerio.load(body)
    let tagRegexp = /#\S+/g
    let url = $('meta[property="og:url"]').attr('content')
    let id = url.split('/').slice(-2, -1)[0]
    let subject = $('meta[property="og:description"]').attr('content').trim()
    let tags = (subject.match(tagRegexp) || []).map((tag) => tag.slice(1))
    let poster = $('meta[property="og:image"]').attr('content')
    return { id, url, subject, poster, tags }
  }

  async _findByPage(query, page) {
    let options = {
      headers: REQUEST_HEADERS,
      query: {
        page,
        keywords: query.search,
      },
    }
    let url = query.genre ? `${BASE_URL}/tag/${query.genre}` : BASE_URL
    let { body } = await got(url, options)
    return this._parseListPage(body)
  }

  async _getItem(type, id) {
    let options = {
      headers: REQUEST_HEADERS,
    }
    let url = `${BASE_URL}/${id}`
    let { body } = await got(url, options)
    return this._parseItemPage(body)
  }

  async _getStreams(type, id) {
    let options = {
      form: true,
      json: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${BASE_URL}/${id}`,
      },
      body: {
        /* eslint-disable-next-line camelcase */
        room_slug: id,
        bandwidth: 'high',
      },
    }
    let { body } = await got.post(GET_STREAM_URL, options)

    if (body.success && body.room_status === 'public') {
      return [{ id, url: body.url }]
    } else {
      return []
    }
  }
}


export default Chaturbate
