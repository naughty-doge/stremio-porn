"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _BaseAdapter = _interopRequireDefault(require("./BaseAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Stream-only adapter that proxies IMDb/TMDb/TVDB/NZBDav ids to a Usenet streamer
class UsenetStreamer extends _BaseAdapter.default {
  constructor(httpClient, options = {}) {
    super(httpClient);
    this.baseUrl = options.baseUrl ? options.baseUrl.replace(/\/+$/, '') : '';
  }

  supportsId(id) {
    if (!this.baseUrl || !id) {
      return false;
    }

    return this.constructor.ID_REGEX.test(id);
  }

  _normalizeStream(stream) {
    return super._normalizeStream(_objectSpread({}, stream, {
      name: stream.name || this.constructor.DISPLAY_NAME,
      title: stream.title || stream.name || this.constructor.DISPLAY_NAME
    }));
  }

  async _findByPage() {
    // UsenetStreamer does not expose catalogs; discovery is handled by other adapters.
    return [];
  }

  async _getItem() {
    return null;
  }

  async _getStreams(type, id) {
    if (!this.baseUrl) {
      return [];
    }

    let url = `${this.baseUrl}/stream/${type}/${encodeURIComponent(id)}.json`;
    let body;

    try {
      ;
      ({
        body
      } = await this.httpClient.request(url, {
        json: true
      }));
    } catch (err) {
      return [];
    }

    if (Array.isArray(body)) {
      return body;
    }

    if (!body || typeof body !== 'object') {
      return [];
    }

    let streams = body.streams;
    return Array.isArray(streams) ? streams : [];
  }

}

_defineProperty(_defineProperty(_defineProperty(_defineProperty(UsenetStreamer, "DISPLAY_NAME", 'Usenet'), "SUPPORTED_TYPES", ['movie', 'tv']), "CATALOG_ID", 'usenet'), "ID_PREFIXES", ['tt', 'tmdb', 'tvdb', 'nzbdav']);

UsenetStreamer.ESCAPED_ID_PREFIXES = UsenetStreamer.ID_PREFIXES.map(prefix => {
  return prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
});
UsenetStreamer.ID_REGEX = new RegExp(`^(${UsenetStreamer.ESCAPED_ID_PREFIXES.join('|')})(:)?`, 'i');
var _default = UsenetStreamer;
exports.default = _default;
//# sourceMappingURL=UsenetStreamer.js.map