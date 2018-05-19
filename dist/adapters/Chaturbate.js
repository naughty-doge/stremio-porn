"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cheerio = _interopRequireDefault(require("cheerio"));

var _BaseAdapter = _interopRequireDefault(require("./BaseAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const BASE_URL = 'https://chaturbate.com';
const GET_STREAM_URL = 'https://chaturbate.com/get_edge_hls_url_ajax/'; // Chaturbate's number of items per page varies from load to load,
// so this is the minimum number

const ITEMS_PER_PAGE = 60;
const SUPPORTED_TYPES = ['tv'];

class Chaturbate extends _BaseAdapter.default {
  _normalizeItem(item) {
    return super._normalizeItem({
      type: 'tv',
      id: item.id,
      name: item.id,
      genre: item.tags,
      banner: item.poster,
      poster: item.poster,
      posterShape: 'landscape',
      website: item.url,
      description: item.subject,
      popularity: item.viewers,
      isFree: true
    });
  }

  _normalizeStream(stream) {
    return super._normalizeStream(_objectSpread({}, stream, {
      title: 'Watch',
      availability: 1,
      live: true,
      isFree: true
    }));
  }

  _parseListPage(body) {
    let $ = _cheerio.default.load(body);

    let tagRegexp = /#\S+/g;
    return $('.list > li').map((i, item) => {
      let $item = $(item);
      let $link = $item.find('.title > a');
      let id = $link.text().trim();
      let url = BASE_URL + $link.attr('href');
      let subject = $item.find('.subject').text().trim();
      let tags = (subject.match(tagRegexp) || []).map(tag => tag.slice(1));
      let poster = $item.find('img').attr('src');
      let viewers = $item.find('.cams').text().match(/(\d+) viewers/i);
      viewers = viewers && Number(viewers[1]);
      return {
        id,
        url,
        subject,
        poster,
        tags,
        viewers
      };
    }).toArray();
  }

  _parseItemPage(body) {
    let $ = _cheerio.default.load(body);

    let tagRegexp = /#\S+/g;
    let url = $('meta[property="og:url"]').attr('content');
    let id = url.split('/').slice(-2, -1)[0];
    let subject = $('meta[property="og:description"]').attr('content').trim();
    let tags = (subject.match(tagRegexp) || []).map(tag => tag.slice(1));
    let poster = $('meta[property="og:image"]').attr('content');
    return {
      id,
      url,
      subject,
      poster,
      tags
    };
  }

  _findByPage(query, page) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let options = {
        query: {
          page,
          keywords: query.search
        }
      };
      let url = query.genre ? `${BASE_URL}/tag/${query.genre}` : BASE_URL;
      let {
        body
      } = yield _this.httpClient.request(url, options);
      return _this._parseListPage(body);
    })();
  }

  _getItem(type, id) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let url = `${BASE_URL}/${id}`;
      let {
        body
      } = yield _this2.httpClient.request(url);
      return _this2._parseItemPage(body);
    })();
  }

  _getStreams(type, id) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      let options = {
        form: true,
        json: true,
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${BASE_URL}/${id}`
        },
        body: {
          /* eslint-disable-next-line camelcase */
          room_slug: id,
          bandwidth: 'high'
        }
      };
      let {
        body
      } = yield _this3.httpClient.request(GET_STREAM_URL, options);

      if (body.success && body.room_status === 'public') {
        return [{
          id,
          url: body.url
        }];
      } else {
        return [];
      }
    })();
  }

}

_defineProperty(_defineProperty(_defineProperty(Chaturbate, "DISPLAY_NAME", 'Chaturbate'), "SUPPORTED_TYPES", SUPPORTED_TYPES), "ITEMS_PER_PAGE", ITEMS_PER_PAGE);

var _default = Chaturbate;
exports.default = _default;
//# sourceMappingURL=Chaturbate.js.map