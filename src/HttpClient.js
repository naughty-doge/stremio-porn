import got from 'got'
import HttpsProxyAgent from 'https-proxy-agent'
import HttpProxyAgent from 'http-proxy-agent'


const DEFAULT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}
const DEFAULT_REQUEST_OPTIONS = {
  timeout: 10000,
}


class HttpClient {
  baseRequestOptions = {
    ...DEFAULT_REQUEST_OPTIONS,
  }

  constructor(options = {}) {
    if (options.proxy) {
      let [host, port] = options.proxy.split(':')
      let agentOptions = { host, port, secureProxy: true }

      this.baseRequestOptions.agent = {
        http: new HttpProxyAgent(agentOptions),
        https: new HttpsProxyAgent(agentOptions),
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
