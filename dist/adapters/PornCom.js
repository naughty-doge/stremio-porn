"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _BaseAdapter = _interopRequireDefault(require("./BaseAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const BASE_URL = 'https://www.porn.com';
const API_URL = 'https://api.porn.com';
const VIDEOS_API_URL = `${API_URL}/videos/find.json`;
const ITEMS_PER_PAGE = 70;
const SUPPORTED_TYPES = ['movie'];

function formatDuration(seconds) {
  seconds = Number(seconds);
  let minutesString = Math.floor(seconds / 60);
  let secondsString = `0${seconds % 60}`.slice(-2);
  return `${minutesString}:${secondsString}`;
}

class PornCom extends _BaseAdapter.default {
  _normalizeItem(item) {
    return super._normalizeItem({
      type: 'movie',
      id: item.id,
      name: item.title,
      genre: item.tags,
      banner: item.thumb,
      poster: item.thumb,
      posterShape: 'landscape',
      website: item.url,
      description: item.url,
      runtime: item.duration ? formatDuration(item.duration) : undefined,
      year: new Date(item.active_date).getFullYear(),
      popularity: item.views && Number(item.views),
      isFree: 1
    });
  }

  _normalizeStream(stream) {
    return super._normalizeStream({
      id: stream.id,
      url: stream.url,
      title: `${stream.quality}p`,
      availability: 1,
      live: true,
      isFree: true
    });
  }

  _makeEmbedUrl(id) {
    return `${BASE_URL}/videos/embed/${id}`;
  }

  _makeDownloadUrl(id, quality) {
    return `${BASE_URL}/download/${quality}/${id}.mp4`;
  }

  _parseApiResponse(response) {
    if (typeof response === 'string') {
      response = JSON.parse(response);
    }

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.result;
  }

  _extractQualitiesFromEmbedPage(body) {
    return body.match(/['"]?id['"]?:\s*['"]\d+p['"]/gi) // Find id:"240p"
    .map(item => item.match(/\d+/)[0]) // Extract 240
    .filter(quality => Number(quality) < 360); // 360+ are restricted
  }

  _getQualities(id) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let embedUrl = _this._makeEmbedUrl(id);

      let {
        body
      } = yield _this.httpClient.request(embedUrl);
      return _this._extractQualitiesFromEmbedPage(body);
    })();
  }

  _findByPage(query, page) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let options = {
        json: true,
        query: {
          page,
          limit: ITEMS_PER_PAGE,
          search: query.search,
          cats: query.genre
        }
      };
      let {
        body
      } = yield _this2.httpClient.request(VIDEOS_API_URL, options);
      return _this2._parseApiResponse(body);
    })();
  }

  _getItem(type, id) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      let options = {
        json: true,
        query: {
          id,
          limit: 1
        }
      };
      let {
        body
      } = yield _this3.httpClient.request(VIDEOS_API_URL, options);
      return _this3._parseApiResponse(body)[0];
    })();
  }

  _getStreams(type, id) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      let qualities = yield _this4._getQualities(id);
      return qualities.map(quality => {
        let url = _this4._makeDownloadUrl(id, quality);

        return {
          id,
          url,
          quality
        };
      });
    })();
  }

}

_defineProperty(_defineProperty(_defineProperty(PornCom, "DISPLAY_NAME", 'Porn.com'), "SUPPORTED_TYPES", SUPPORTED_TYPES), "ITEMS_PER_PAGE", ITEMS_PER_PAGE);

var _default = PornCom;
exports.default = _default;
//# sourceMappingURL=PornCom.js.map