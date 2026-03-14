import got from 'got'
import HttpsProxyAgent from 'https-proxy-agent'
import HttpProxyAgent from 'http-proxy-agent'


const DEFAULT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}
const DEFAULT_REQUEST_OPTIONS = {
  timeout: 20000,
}


class HttpClient {
  baseRequestOptions = {
    ...DEFAULT_REQUEST_OPTIONS,
  }

  constructor(options = {}) {
    if (options.proxy) {
      this.baseRequestOptions.agent = {
        http: new HttpProxyAgent(options.proxy),
        https: new HttpsProxyAgent(options.proxy),
      }
    }
  }

  request(url, reqOptions = {}) {
    let headers

    if (reqOptions.headers) {
      headers = { ...DEFAULT_HEADERS, ...reqOptions.headers }
    } else {
      headers = DEFAULT_HEADERS
    }

    reqOptions = {
      ...this.baseRequestOptions,
      ...reqOptions,
      headers,
    }

    return got(url, reqOptions)
  }
}


export default HttpClient
