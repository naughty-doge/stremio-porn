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
      id: video.video_id,
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
    return super._normalizeStream({
      ...stream,
      availability: 1,
      isFree: 1,
      title: (stream.title && stream.title.trim()) || 'SD',
    })
  }

  _makeMethodUrl() {
    throw new Error('Not implemented')
  }

  _makeEmbeddedVideoUrl() {
    throw new Error('Not implemented')
  }

  _parseEmbeddedVideoPage() {
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
      throw new Error(body.message)
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
    let { videos } = await this._requestApi('searchVideos', newQuery)
    return videos
  }

  async _getItem(type, id) {
    let query = {
      [this.constructor.VIDEO_ID_PARAMETER]: id,
    }
    return this._requestApi('getVideoById', query)
  }

  async _getStreams(type, id) {
    let url = this._makeEmbeddedVideoUrl(id)
    let { body } = await this.httpClient.request(url)

    let stream = this._parseEmbeddedVideoPage(body)
    return [{ id, url: stream.url }]
  }
}


export default HubTrafficAdapter
