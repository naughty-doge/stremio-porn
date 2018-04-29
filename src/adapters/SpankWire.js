import HubTrafficAdapter from './HubTrafficAdapter'


class SpankWire extends HubTrafficAdapter {
  static DISPLAY_NAME = 'SpankWire'
  static ITEMS_PER_PAGE = 20

  _makeMethodUrl(method) {
    return `https://www.spankwire.com/api/HubTrafficApiCall?data=${method}`
  }

  _makeEmbedUrl(id) {
    return `https://www.spankwire.com/EmbedPlayer.aspx?ArticleId=${id}`
  }

  _extractStreamsFromEmbed(body) {
    /* eslint-disable max-len */
    // URL examples:
    // \/\/cdn1-embed-spankwire.spankcdn.net\/201505\/13\/1812784\/180P_200k_1812784.mp4?validfrom=1524836136&validto=1524843336&rate=45k&burst=450k&hash=djplLdzje8I9RZWDeUa8EtjK4mw%3D
    // \/\/cdn1-embed-extremetube.spankcdn.net\/media\/\/201804\/29\/24260991\/mp4_720p_24260991.mp4?validfrom=1524996113&validto=1525003313&rate=141k&burst=2000k&hash=8lag09lM%2BHc%2F%2Frgi4Kcc6gObcr4%3D
    // \/\/cdn1-embed-extremetube.spankcdn.net\/media\/\/201804\/29\/24260991\/mp4_normal_24260991.mp4?validfrom=1524996113&validto=1525003313&rate=34k&burst=2000k&hash=d3lzXN0Tx0e9%2BId7wp%2Bf1T8Momo%3D
    /* eslint-enable max-len */

    let urlRegexp = /playerData.cdnPath\d+\s*=\s*["']?[^"'\s]+["']/gi
    let urlMatches = body.match(urlRegexp)

    if (!urlMatches || !urlMatches.length) {
      throw new Error('Unable to extract streams from an embed page')
    }

    return urlMatches.map((item) => {
      let url = item
        .match(/["']([^"'\s]+)["']/i)[1] // Extract the URL
        .replace(/\\/g, '') // Remove backslashes

      if (url[0] === '/') {
        url = `https:${url}`
      }

      // Two possible quality formats: "720p" and "high"
      let qualityMatch = url.match(/\/(mp4_)?(\d+p|low|normal|high|ultra)/i)
      let quality

      if (qualityMatch && qualityMatch[2]) {
        quality = qualityMatch[2]
        quality = quality[0].toUpperCase() + quality.slice(1).toLowerCase()
      }

      return { url, quality }
    })
  }
}


export default SpankWire
