"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _HubTrafficAdapter = _interopRequireDefault(require("./HubTrafficAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class PornHub extends _HubTrafficAdapter.default {
  _makeMethodUrl(method) {
    let methodAliases = {
      searchVideos: 'search',
      getVideoById: 'video_by_id'
    };
    return `https://www.pornhub.com/webmasters/${methodAliases[method]}`;
  }

  _makeEmbedUrl(id) {
    return `https://www.pornhub.com/embed/${id}`;
  }

  _extractStreamsFromEmbed(body) {
    /* eslint-disable max-len */
    // URL example:
    // https:\/\/de.phncdn.com\/videos\/201503\/28\/46795732\/vl_480_493k_46795732.mp4?ttl=1522227092&ri=1228800&rs=696&hash=268b5f4d76927209ef554ac9e93c6c85
    let regexp = /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[a-z]+\.phncdn\.com[^"']+)/gi;
    /* eslint-enable max-len */

    let urlMatches = regexp.exec(body);

    if (!urlMatches || !urlMatches[1]) {
      throw new Error('Unable to extract a stream URL from an embed page');
    }

    let url = urlMatches[1].replace(/[\\/]+/g, '/') // Normalize the slashes...
    .replace(/(https?:\/)/, '$1/'); // ...but keep the // after "https:"

    if (url[0] === '/') {
      url = `https:/${url}`;
    }

    return [{
      url
    }];
  }

}

_defineProperty(_defineProperty(_defineProperty(PornHub, "DISPLAY_NAME", 'PornHub'), "ITEMS_PER_PAGE", 30), "VIDEO_ID_PARAMETER", 'id');

var _default = PornHub;
exports.default = _default;
//# sourceMappingURL=PornHub.js.map