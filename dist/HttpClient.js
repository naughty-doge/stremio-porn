"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _got = _interopRequireDefault(require("got"));

var _httpsProxyAgent = _interopRequireDefault(require("https-proxy-agent"));

var _httpProxyAgent = _interopRequireDefault(require("http-proxy-agent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const DEFAULT_HEADERS = {
  'user-agent': 'stremio-porn'
};
const DEFAULT_REQUEST_OPTIONS = {
  timeout: 20000
};

class HttpClient {
  constructor(options = {}) {
    _defineProperty(this, "baseRequestOptions", _objectSpread({}, DEFAULT_REQUEST_OPTIONS));

    if (options.proxy) {
      let [host, port] = options.proxy.split(':');
      let agentOptions = {
        host,
        port,
        secureProxy: true
      };
      this.baseRequestOptions.agent = {
        http: new _httpProxyAgent.default(agentOptions),
        https: new _httpsProxyAgent.default(agentOptions)
      };
    }
  }

  request(url, reqOptions = {}) {
    let headers;

    if (reqOptions.headers) {
      headers = _objectSpread({}, DEFAULT_HEADERS, reqOptions.headers);
    } else {
      headers = DEFAULT_HEADERS;
    }

    reqOptions = _objectSpread({}, this.baseRequestOptions, reqOptions, {
      headers
    });
    return (0, _got.default)(url, reqOptions);
  }

}

var _default = HttpClient;
exports.default = _default;
//# sourceMappingURL=HttpClient.js.map