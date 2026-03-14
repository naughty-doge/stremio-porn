import HubTrafficAdapter from './HubTrafficAdapter'


class PornHub extends HubTrafficAdapter {
  static DISPLAY_NAME = 'PornHub'
  static ITEMS_PER_PAGE = 30
  static VIDEO_ID_PARAMETER = 'id'

  _makeMethodUrl(method) {
    let methodAliases = {
      searchVideos: 'search',
      getVideoById: 'video_by_id',
    }
    return `https://www.pornhub.com/webmasters/${methodAliases[method]}`
  }

  _makeEmbedUrl(id) {
    return `https://www.pornhub.com/embed/${id}`
  }

  _extractStreamsFromEmbed(body) {
  // Try multiple patterns for different PornHub embed formats
    let patterns = [
      /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[^"',\s]+\.mp4[^"',\s]*)/gi,
      /"url"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/gi,
      /setVideoHLS\(['"]([^'"]+)['"]\)/gi,
      /hlsManifestUrl["']?\s*:\s*["']?([^"',\s]+)/gi,
    ]

    for (let regexp of patterns) {
      let match = regexp.exec(body)
      if (match && match[1]) {
        let url = match[1]
          .replace(/\\\/\\/g, '/')
          .replace(/[\\/]+/g, '/')
          .replace(/(https?:\/)/, '$1/')
        if (url[0] === '/') {
          url = `https:/${url}`
        }
        return [{ url }]
      }
    }

    throw new Error('Unable to extract a stream URL from an embed page')
  }
}

export default PornHub
