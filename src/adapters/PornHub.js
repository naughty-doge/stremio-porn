import HubTrafficAdapter from './HubTrafficAdapter'


class PornHub extends HubTrafficAdapter {
  static ITEMS_PER_PAGE = 30
  static VIDEO_ID_PARAMETER = 'id'

  _makeMethodUrl(method) {
    let methodAliases = {
      searchVideos: 'search',
      getVideoById: 'video_by_id',
    }
    return `https://www.pornhub.com/webmasters/${methodAliases[method]}`
  }

  _makeEmbeddedVideoUrl(id) {
    return `https://www.pornhub.com/embed/${id}`
  }

  _parseEmbeddedVideoPage(body) {
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
}


export default PornHub
