import got from 'got'
import HttpsProxyAgent from 'https-proxy-agent'
import HttpProxyAgent from 'http-proxy-agent'


const DEFAULT_HEADERS = {
  'user-agent': 'stremio-porn',
}
const DEFAULT_REQUEST_OPTIONS = {
  timeout: 5000,
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
