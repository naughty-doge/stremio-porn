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
    /* eslint-disable max-len */
    // URL example:
    // https://ce.rdtcdn.com/media/videos/201803/12/4930561/480P_600K_4930561.mp4?a5dcae8e1adc0bdaed975f0...
    let regexp = /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[a-z_-]+\.rdtcdn\.com[^"']+)/gi
    /* eslint-enable max-len */
    let urlMatches = regexp.exec(body)

    if (!urlMatches || !urlMatches[1]) {
      throw new Error('Unable to extract a stream URL from an embed page')
    }

    let url = urlMatches[1]
      .replace(/[\\/]+/g, '/') // Normalize the slashes...
      .replace(/(https?:\/)/, '$1/') // ...but keep the // after "https:"
    let qualityMatch = url.match(/\/(\d+p)/i)
    let quality = qualityMatch && qualityMatch[1].toLowerCase()

    if (url[0] === '/') {
      url = `https:/${url}`
    }

    return [{ url, quality }]
  }
}


export default RedTube
