import got from 'got'
import PornAdapter from './PornAdapter'


const API_URL = 'https://api.redtube.com'
const EMBED_URL = 'https://embed.redtube.com'
const TAGS_TO_SKIP = ['teens'] // For some reason Teens doesn't work properly
const ITEMS_PER_PAGE = 20
const SUPPORTED_TYPES = ['movie']
const REQUEST_HEADERS = {
  'user-agent': 'stremio-porn',
}


class RedTube extends PornAdapter {
  static SUPPORTED_TYPES = SUPPORTED_TYPES
  static ITEMS_PER_PAGE = ITEMS_PER_PAGE

  _normalizeItemResult({ video }) {
    let tags = video.tags && Object.values(video.tags)
      .map((tag) => {
        return (typeof tag === 'string') ? tag : tag.tag_name
      })
      .filter((tag) => !TAGS_TO_SKIP.includes(tag.toLowerCase()))

    return {
      type: 'movie',
      id: video.video_id,
      name: video.title,
      genre: tags,
      banner: video.thumb,
      poster: video.thumb,
      posterShape: 'landscape',
      year: video.publish_date && video.publish_date.split('-')[0],
      website: video.url,
      description: video.url,
      runtime: video.duration,
      popularity: Number(video.views),
      isFree: 1,
    }
  }

  _normalizeStreamResult(stream) {
    return {
      ...stream,
      availability: 1,
      isFree: 1,
      title: stream.title || 'SD',
    }
  }

  async _requestApi(query) {
    let options = {
      json: true,
      headers: REQUEST_HEADERS,
      query: {
        ...query,
        output: 'json',
        period: 'weekly',
        thumbsize: query.thumbsize || 'medium',
      },
    }

    if (query.tag) {
      options.query['tags[]'] = query.tag
    }

    let { body } = await got(API_URL, options)

    if (body.code) {
      throw new Error(body.message)
    }

    return body
  }

  async _findVideosByPage(query, page) {
    let newQuery = {
      data: 'redtube.Videos.searchVideos',
      tag: query.genre,
      search: query.search,
      page,
    }
    let { videos } = await this._requestApi(newQuery)
    return videos
  }

  async _findByPages(query, pages) {
    let requests = pages.map((page) => {
      return this._findVideosByPage(query, page)
    })
    let responses = await Promise.all(requests)
    return [].concat(...responses)
  }

  async _getItem(type, id) {
    let query = {
      data: 'redtube.Videos.getVideoById',
      // eslint-disable-next-line camelcase
      video_id: Number(id),
    }
    return this._requestApi(query)
  }

  async _getStreams(type, id) {
    let options = {
      headers: REQUEST_HEADERS,
      query: { id },
    }
    let { body, statusCode } = await got(EMBED_URL, options)

    if (statusCode < 200 || statusCode > 299) {
      throw new Error(
        `Unable to get a stream for movie ${id} (status code ${statusCode})`
      )
    }

    /* eslint-disable max-len */
    // URL example:
    // https://ce.rdtcdn.com/media/videos/201803/12/4930561/480P_600K_4930561.mp4?a5dcae8e1adc0bdaed975f0...
    let regexp = /videoUrl"?\s*:\s*"?(https?:\\?\/\\?\/[a-z]+\.rdtcdn\.com[^"]+)/gi
    /* eslint-enable max-len */
    let urlMatches = regexp.exec(body)

    if (!urlMatches || !urlMatches[1]) {
      throw new Error(
        `Unable to extract a stream URL from ${EMBED_URL}?id=${id}`
      )
    }

    let url = urlMatches[1]
      .replace(/[\\/]+/g, '/') // Normalize the slashes...
      .replace(/(https?:\/)/, '$1/') // ...but keep the // after "https:"
    let fileName = url.split('/').pop().split('?')[0]
    let qualityMatches = fileName.match(/\d+p/i)
    let quality = qualityMatches && qualityMatches[0].toLowerCase()

    return [{ id, url, title: quality }]
  }
}


export default RedTube
