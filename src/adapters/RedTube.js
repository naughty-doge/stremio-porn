import HubTrafficAdapter from './HubTrafficAdapter'


class RedTube extends HubTrafficAdapter {
  static DISPLAY_NAME = 'RedTube'
  static TAGS_TO_SKIP = ['teens'] // For some reason Teens doesn't work properly
  static ITEMS_PER_PAGE = 20

  _makeMethodUrl(method) {
    return `https://api.redtube.com?data=redtube.Videos.${method}`
  }

  _makeEmbedUrl(id) {
    return `https://embed.redtube.com?id=${id}`
  }

  _extractStreamsFromEmbed(body) {
    // Try absolute rdtcdn.com URLs (old format)
    /* eslint-disable max-len */
    let absoluteRegexp = /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[a-z_-]+\.rdtcdn\.com[^"']+)/gi
    /* eslint-enable max-len */
    let absoluteMatch = absoluteRegexp.exec(body)
    if (absoluteMatch && absoluteMatch[1]) {
      let url = absoluteMatch[1]
        .replace(/[\\/]+/g, '/')
        .replace(/(https?:\/)/, '$1/')
      if (url[0] === '/') {
        url = `https:/${url}`
      }
      let qualityMatch = url.match(/\/(\d+p)/i)
      return [{ url, quality: qualityMatch && qualityMatch[1].toLowerCase() }]
    }

    // Try relative signed URLs (new format), slashes are JSON-escaped as \/
    let mp4Regexp = /videoUrl["']?\s*:\s*["']?(\\?\/media\\?\/mp4\?[^"']+)/gi
    let mp4Match = mp4Regexp.exec(body)
    if (mp4Match && mp4Match[1]) {
      let url = `https://embed.redtube.com${mp4Match[1].replace(/\\/g, '')}`
      return [{ url }]
    }

    let hlsRegexp = /videoUrl["']?\s*:\s*["']?(\\?\/media\\?\/hls\?[^"']+)/gi
    let hlsMatch = hlsRegexp.exec(body)
    if (hlsMatch && hlsMatch[1]) {
      let url = `https://embed.redtube.com${hlsMatch[1].replace(/\\/g, '')}`
      return [{ url }]
    }

    throw new Error('Unable to extract a stream URL from an embed page')
  }
}


export default RedTube
