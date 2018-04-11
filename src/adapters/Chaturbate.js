import cheerio from 'cheerio'
import BaseAdapter from './BaseAdapter'


const BASE_URL = 'https://chaturbate.com'
const GET_STREAM_URL = 'https://chaturbate.com/get_edge_hls_url_ajax/'
// Chaturbate's number of items per page varies from load to load,
// so this is the minimum number
const ITEMS_PER_PAGE = 60
const SUPPORTED_TYPES = ['tv']


class Chaturbate extends BaseAdapter {
  static SUPPORTED_TYPES = SUPPORTED_TYPES
  static ITEMS_PER_PAGE = ITEMS_PER_PAGE

  _normalizeItem(item) {
    return super._normalizeItem({
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
    })
  }

  _normalizeStream(stream) {
    return super._normalizeStream({
      ...stream,
      title: 'Watch',
      availability: 1,
      live: true,
      isFree: true,
    })
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
      query: {
        page,
        keywords: query.search,
      },
    }
    let url = query.genre ? `${BASE_URL}/tag/${query.genre}` : BASE_URL
    let { body } = await this.httpClient.request(url, options)
    return this._parseListPage(body)
  }

  async _getItem(type, id) {
    let url = `${BASE_URL}/${id}`
    let { body } = await this.httpClient.request(url)
    return this._parseItemPage(body)
  }

  async _getStreams(type, id) {
    let options = {
      form: true,
      json: true,
      method: 'post',
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
    let { body } = await this.httpClient.request(GET_STREAM_URL, options)

    if (body.success && body.room_status === 'public') {
      return [{ id, url: body.url }]
    } else {
      return []
    }
  }
}


export default Chaturbate
