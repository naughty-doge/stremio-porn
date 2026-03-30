import cheerio from 'cheerio'
import BaseAdapter from './BaseAdapter'


const BASE_URL = 'https://www.xvideos.com'
const ITEMS_PER_PAGE = 27


class XVideos extends BaseAdapter {
  static DISPLAY_NAME = 'XVideos'
  static SUPPORTED_TYPES = ['movie']
  static ITEMS_PER_PAGE = ITEMS_PER_PAGE

  _normalizeItem(item) {
    return super._normalizeItem({
      type: 'movie',
      id: item.id,
      name: item.name,
      genre: item.tags || [],
      banner: item.poster,
      poster: item.poster,
      posterShape: 'landscape',
      website: item.url,
      description: item.description || item.url,
      runtime: item.duration,
      year: item.year,
      isFree: 1,
    })
  }

  _normalizeStream(stream) {
    return super._normalizeStream({
      id: stream.id,
      url: stream.url,
      title: stream.quality || 'Watch',
      availability: 1,
      isFree: true,
    })
  }

  _parseSearchResults(body) {
    let $ = cheerio.load(body)
    let items = []

    $('.thumb-block').each((i, el) => {
      let $el = $(el)
      let $link = $el.find('.thumb-inside a').first()
      let href = $link.attr('href') || ''
      let id = href.split('/')[1] || ''
      let name = $el.find('.thumb-under .title a').attr('title') ||
                 $el.find('.thumb-under .title a').text().trim() || ''
      let poster = $el.find('.thumb-inside img').attr('data-src') ||
                   $el.find('.thumb-inside img').attr('src') || ''
      let duration = $el.find('.duration').text().trim()
      let url = href.startsWith('http') ? href : `${BASE_URL}${href}`

      if (id && name) {
        items.push({ id, name, poster, duration, url })
      }
    })

    return items
  }

  _extractStreamsFromPage(body) {
    let streams = []

    // XVideos stores video URLs in html5player JavaScript calls
    let hlsMatch = body.match(
      /html5player\.setVideoHLS\(['"]([^'"]+)['"]\)/
    )
    if (hlsMatch && hlsMatch[1]) {
      streams.push({ url: hlsMatch[1], quality: 'HLS' })
    }

    let highMatch = body.match(
      /html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/
    )
    if (highMatch && highMatch[1]) {
      streams.push({ url: highMatch[1], quality: 'High' })
    }

    let lowMatch = body.match(
      /html5player\.setVideoUrlLow\(['"]([^'"]+)['"]\)/
    )
    if (lowMatch && lowMatch[1]) {
      streams.push({ url: lowMatch[1], quality: 'Low' })
    }

    return streams
  }

  async _findByPage(query, page) {
    let url
    if (query.search) {
      let encoded = encodeURIComponent(query.search)
      url = `${BASE_URL}/?k=${encoded}&p=${page - 1}`
    } else if (query.genre) {
      let encoded = encodeURIComponent(query.genre)
      url = `${BASE_URL}/c/${encoded}/${page - 1}`
    } else {
      url = page > 1
        ? `${BASE_URL}/new/${page - 1}`
        : `${BASE_URL}/new`
    }

    let { body } = await this.httpClient.request(url)
    return this._parseSearchResults(body)
  }

  _extractMetadataFromPage(body) {
    let $ = cheerio.load(body)

    let name = ($('meta[property="og:title"]').attr('content') || '').trim()
    let poster = $('meta[property="og:image"]').attr('content') || ''
    let pageUrl = $('meta[property="og:url"]').attr('content') || ''
    let description = ($('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') || '').trim()

    let tags = []
    let keywords = ($('meta[name="keywords"]').attr('content') || '').trim()
    if (keywords) {
      tags = keywords.split(',').map((t) => t.trim()).filter(Boolean)
    }
    if (!tags.length) {
      $('.video-tags-list a, .is-keyword a').each((i, el) => {
        let tag = $(el).text().trim()
        if (tag && tag !== '+') tags.push(tag)
      })
    }

    let duration = ''
    let durationMatch = body.match(
      /html5player\.setVideoTitle[^;]*;[\s\S]*?var\s+video_duration\s*=\s*['"]?(\d+)/
    )
    if (!durationMatch) {
      durationMatch = body.match(/"duration"\s*:\s*"?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"?/)
    }
    if (durationMatch) {
      if (durationMatch[2] !== undefined || durationMatch[3] !== undefined) {
        let h = parseInt(durationMatch[1], 10) || 0
        let m = parseInt(durationMatch[2], 10) || 0
        let s = parseInt(durationMatch[3], 10) || 0
        duration = String(h * 3600 + m * 60 + s)
      } else {
        duration = durationMatch[1]
      }
    }

    let year = ''
    let dateMatch = body.match(
      /"uploadDate"\s*:\s*"(\d{4})-/
    )
    if (dateMatch) {
      year = parseInt(dateMatch[1], 10)
    }

    return { name, poster, pageUrl, description, tags, duration, year }
  }

  async _getItem(type, id) {
    let url = `${BASE_URL}/${id}`
    let { body } = await this.httpClient.request(url)
    let meta = this._extractMetadataFromPage(body)

    return {
      id,
      name: meta.name,
      poster: meta.poster,
      url: meta.pageUrl || url,
      tags: meta.tags,
      duration: meta.duration,
      description: meta.description || meta.pageUrl || url,
      year: meta.year,
    }
  }

  async _getStreams(type, id) {
    let url = `${BASE_URL}/${id}`
    let { body } = await this.httpClient.request(url)
    let streams = this._extractStreamsFromPage(body)
    return streams.map((stream) => ({ ...stream, id }))
  }
}


export default XVideos
