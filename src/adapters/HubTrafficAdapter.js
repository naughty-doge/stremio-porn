import { URL } from 'url'
import BaseAdapter from './BaseAdapter'


class HubTrafficAdapter extends BaseAdapter {
  static SUPPORTED_TYPES = ['movie']
  static TAGS_TO_SKIP = []
  static VIDEO_ID_PARAMETER = 'video_id'

  _normalizeItem(item) {
    let video = item.video || item
    let { TAGS_TO_SKIP } = this.constructor
    let tags = video.tags && Object.values(video.tags)
      .map((tag) => {
        return (typeof tag === 'string') ? tag : tag.tag_name
      })
      .filter((tag) => !TAGS_TO_SKIP.includes(tag.toLowerCase()))

    return super._normalizeItem({
      type: 'movie',
      id: video.video_id || video.id,
      name: video.title.trim(),
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
    })
  }

  _normalizeStream(stream) {
    let title =
      (stream.title && stream.title.trim()) ||
      (stream.quality && stream.quality.trim()) ||
      'SD'

    return super._normalizeStream({
      ...stream,
      title,
      availability: 1,
      isFree: 1,
    })
  }

  _makeMethodUrl() {
    throw new Error('Not implemented')
  }

  _makeEmbedUrl() {
    throw new Error('Not implemented')
  }

  _extractStreamsFromEmbed() {
    throw new Error('Not implemented')
  }

  async _requestApi(method, params) {
    let options = {
      json: true,
    }
    let url = this._makeMethodUrl(method)

    if (params) {
      url = new URL(url)
      Object.keys(params).forEach((name) => {
        if (params[name] !== undefined) {
          url.searchParams.set(name, params[name])
        }
      })
    }

    let { body } = await this.httpClient.request(url, options)

    if (body.code) {
      let err = new Error(body.message)
      err.code = Number(body.code)
      throw err
    }

    return body
  }

  async _findByPage(query, page) {
    let newQuery = {
      'tags[]': query.genre,
      search: query.search,
      period: 'weekly',
      ordering: 'mostviewed',
      thumbsize: 'medium',
      page,
    }
    let result

    try {
      result = await this._requestApi('searchVideos', newQuery)
    } catch (err) {
      // For an unknown reason the weekly period doesn't always work,
      // so in case of error we retry with "monthly"
      if (err.code !== 2001) { // 2001 is "No Videos found!"
        throw err
      }

      newQuery.period = 'monthly'
      result = await this._requestApi('searchVideos', newQuery)
    }

    return result.videos || result.video
  }

  async _getItem(type, id) {
    let query = {
      [this.constructor.VIDEO_ID_PARAMETER]: id,
    }
    return this._requestApi('getVideoById', query)
  }

  async _getStreams(type, id) {
    let url = this._makeEmbedUrl(id)
    let { body } = await this.httpClient.request(url)

    let streams = this._extractStreamsFromEmbed(body)
    return streams && streams.map((stream) => {
      stream.id = id
      return stream
    })
  }
}


export default HubTrafficAdapter
