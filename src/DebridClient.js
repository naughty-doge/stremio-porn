class DebridClient {
  constructor(httpClient, options = {}) {
    this.httpClient = httpClient
    this.realDebridToken = options.realDebridToken
    this.torboxToken = options.torboxToken
    this.torboxEndpoint = 'https://api.torbox.app/v1/links/instant'
    this.torboxCacheEndpoint = 'https://api.torbox.app/v1/api/webdl/checkcached'
  }

  get isEnabled() {
    return Boolean(this.realDebridToken || this.torboxToken)
  }

  _encodeForm(params = {}) {
    return Object.keys(params)
      .filter((key) => params[key] !== null && params[key] !== undefined)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
  }

  _pickUrl(body) {
    if (!body || typeof body !== 'object') {
      return null
    }

    if (typeof body.download === 'string') {
      return body.download
    }

    if (typeof body.link === 'string') {
      return body.link
    }

    if (typeof body.location === 'string') {
      return body.location
    }

    if (body.data && typeof body.data === 'object') {
      return this._pickUrl(body.data)
    }

    return null
  }

  async _checkTorboxCache(url) {
    if (!this.torboxToken || !url) {
      return null
    }

    try {
      let encoded = encodeURIComponent(url)
      let checkUrl = `${this.torboxCacheEndpoint}?url=${encoded}`
      let { body } = await this.httpClient.request(checkUrl, {
        headers: {
          Authorization: `Bearer ${this.torboxToken}`,
        },
        json: true,
      })

      if (body && body.data && body.data.cached === true) {
        return true
      }

      return false
    } catch (err) {
      return null
    }
  }

  async _unrestrictWithRealDebrid(url) {
    if (!this.realDebridToken) {
      return null
    }

    try {
      let { body } = await this.httpClient.request(
        'https://api.real-debrid.com/rest/1.0/unrestrict/link',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.realDebridToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: this._encodeForm({ link: url }),
          json: true,
        }
      )
      return this._pickUrl(body)
    } catch (err) {
      return null
    }
  }

  async _unrestrictWithTorbox(url) {
    if (!this.torboxToken) {
      return null
    }

    try {
      let isCached = await this._checkTorboxCache(url)

      if (isCached === false) {
        return null
      }

      let { body } = await this.httpClient.request(this.torboxEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.torboxToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this._encodeForm({ url }),
        json: true,
      })
      return this._pickUrl(body)
    } catch (err) {
      return null
    }
  }

  async _unrestrict(url) {
    if (!url || !this.isEnabled) {
      return null
    }

    if (this.realDebridToken) {
      return this._unrestrictWithRealDebrid(url)
    }

    return this._unrestrictWithTorbox(url)
  }

  async unrestrictStreams(streams) {
    if (!Array.isArray(streams) || !this.isEnabled) {
      return streams || []
    }

    return Promise.all(streams.map(async (stream) => {
      if (!stream || !stream.url) {
        return stream
      }

      let unrestrictedUrl = await this._unrestrict(stream.url)

      if (unrestrictedUrl && unrestrictedUrl !== stream.url) {
        return {
          ...stream,
          url: unrestrictedUrl,
          name: stream.name || 'Debrid',
        }
      } else {
        return stream
      }
    }))
  }
}


export default DebridClient
