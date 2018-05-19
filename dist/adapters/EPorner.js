"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _xmlJs = require("xml-js");

var _cheerio = _interopRequireDefault(require("cheerio"));

var _BaseAdapter = _interopRequireDefault(require("./BaseAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const BASE_URL = 'https://www.eporner.com';
const ITEMS_PER_PAGE = 60;
const SUPPORTED_TYPES = ['movie'];

class EPorner extends _BaseAdapter.default {
  _normalizePageItem(item) {
    let id = item.url.split('/')[4];
    let duration = item.duration && item.duration.replace('M', ':').replace(/[TS]/gi, '');
    return {
      type: 'movie',
      id: id,
      name: item.title,
      genre: item.tags,
      banner: item.image,
      poster: item.image,
      posterShape: 'landscape',
      website: item.url,
      description: item.url,
      runtime: duration,
      isFree: 1
    };
  }

  _normalizeApiItem(item) {
    let tags = item.keywords && item.keywords._text.split(',').slice(1).map(keyword => keyword.trim()).filter(keyword => keyword.split(' ').length < 3);

    return {
      type: 'movie',
      id: item.sid ? item.sid._text : item.id._text,
      name: item.title._text,
      genre: tags,
      banner: item.imgthumb._text,
      poster: item['imgthumb320x240']._text,
      posterShape: 'landscape',
      website: item.loc._text,
      description: item.loc._text,
      runtime: item.lenghtmin._text,
      popularity: Number(item.views._text || 0),
      isFree: 1
    };
  }

  _normalizeItem(item) {
    if (item._source === 'moviePage') {
      item = this._normalizePageItem(item);
    } else {
      item = this._normalizeApiItem(item);
    }

    return super._normalizeItem(item);
  }

  _normalizeStream(stream) {
    let quality = stream.url.match(/-(\d+)p/i);
    return super._normalizeStream({
      id: stream.id,
      url: stream.url,
      title: quality ? quality[1] : 'Watch',
      availability: 1,
      live: true,
      isFree: true
    });
  }

  _makeApiUrl(query, skip, limit) {
    let {
      search,
      genre
    } = query;
    let keywords;

    if (search && genre) {
      keywords = `${genre},${search}`;
    } else {
      keywords = search || genre || 'all';
    }

    keywords = keywords.replace(' ', '+');
    return `${BASE_URL}/api_xml/${keywords}/${limit}/${skip}/adddate`;
  }

  _makeMovieUrl(id) {
    return `${BASE_URL}/hd-porn/${id}`;
  }

  _makeVideoDownloadUrl(path) {
    return BASE_URL + path;
  }

  _parseApiResponse(xml) {
    let results = (0, _xmlJs.xml2js)(xml, {
      compact: true,
      trim: true
    })['eporner-data'].movie;

    if (!results) {
      return [];
    } else if (!Array.isArray(results)) {
      return [results];
    } else {
      return results;
    }
  }

  _parseMoviePage(body) {
    let $ = _cheerio.default.load(body);

    let title = $('meta[property="og:title"]').attr('content').replace(/(\s*-\s*)?EPORNER/i, '');
    let description = $('meta[property="og:description"]').attr('content');
    let duration = description.match(/duration:\s*((:?\d)+)/i)[1];
    let url = $('meta[property="og:url"]').attr('content');
    let image = $('meta[property="og:image"]').attr('content');
    let tags = $('#hd-porn-tags td').filter((i, item) => $(item).text().trim() === 'Tags:').next().find('a').map((i, item) => $(item).text().trim()).toArray();
    let downloadUrls = $('#hd-porn-dload a').map((i, link) => {
      let href = $(link).attr('href');
      return this._makeVideoDownloadUrl(href);
    }).toArray();
    return {
      _source: 'moviePage',
      title,
      url,
      image,
      tags,
      duration,
      downloadUrls
    };
  }

  _find(query, {
    skip,
    limit
  }) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let url = _this._makeApiUrl(query, skip, limit);

      let {
        body
      } = yield _this.httpClient.request(url);
      return _this._parseApiResponse(body);
    })();
  }

  _getItem(type, id) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let url = _this2._makeMovieUrl(id);

      let {
        body
      } = yield _this2.httpClient.request(url);
      return _this2._parseMoviePage(body);
    })();
  }

  _getStreams(type, id) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      // Video downloads are restricted to 30 per day per guest
      let url = _this3._makeMovieUrl(id);

      let {
        body
      } = yield _this3.httpClient.request(url);

      let {
        downloadUrls
      } = _this3._parseMoviePage(body);

      let streamUrls = downloadUrls.map(url => {
        return _this3.httpClient.request(url, {
          followRedirect: false
        });
      });
      streamUrls = yield Promise.all(streamUrls);
      return streamUrls.map(res => {
        return {
          id,
          url: res.headers.location
        };
      }).filter(stream => stream.url);
    })();
  }

}

_defineProperty(_defineProperty(_defineProperty(EPorner, "DISPLAY_NAME", 'EPorner'), "SUPPORTED_TYPES", SUPPORTED_TYPES), "ITEMS_PER_PAGE", ITEMS_PER_PAGE);

var _default = EPorner;
exports.default = _default;
//# sourceMappingURL=EPorner.js.map