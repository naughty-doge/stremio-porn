import HubTrafficAdapter from './HubTrafficAdapter'


class YouPorn extends HubTrafficAdapter {
  static DISPLAY_NAME = 'YouPorn'
  static ITEMS_PER_PAGE = 29

  _makeMethodUrl(method) {
    let methodAliases = {
      searchVideos: 'search',
      getVideoById: 'video_by_id',
    }
    return `https://www.youporn.com/api/webmasters/${methodAliases[method]}`
  }

  _makeEmbedUrl(id) {
    return `http://www.youporn.com/embed/${id}`
  }

  _extractStreamsFromEmbed(body) {
    /* eslint-disable max-len */
    // URL example:
    // https:\/\/ee.ypncdn.com\/201709\/01\/14062051\/720p_1500k_14062051\/YouPorn_-_mia-khalifa-big-tits-arab-pornstar-takes-a-fan-s-virginity.mp4?rate=193k&burst=1400k&validfrom=1524765800&validto=1524780200&hash=EGRxkAOZwod648gfnITHeyb%2Fzi8%3D
    let regexp = /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[a-z]+\.ypncdn\.com[^"']+)/gi
    /* eslint-enable max-len */

    let urlMatches = body.match(regexp)

    if (!urlMatches || !urlMatches.length) {
      throw new Error('Unable to extract streams from an embed page')
    }

    return urlMatches.map((item) => {
      let url = item
        .match(/http.+/)[0] // Extract the URL
        .replace(/[\\/]+/g, '/') // Normalize the slashes...
        .replace(/(https?:\/)/, '$1/') // ...but keep the // after "https:"
      let qualityMatch = url.match(/\/(\d+p)/i)
      let quality = qualityMatch && qualityMatch[1].toLowerCase()

      if (url[0] === '/') {
        url = `https:/${url}`
      }

      return { url, quality }
    })
  }
}


export default YouPorn
