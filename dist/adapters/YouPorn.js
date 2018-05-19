"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _HubTrafficAdapter = _interopRequireDefault(require("./HubTrafficAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class YouPorn extends _HubTrafficAdapter.default {
  _makeMethodUrl(method) {
    let methodAliases = {
      searchVideos: 'search',
      getVideoById: 'video_by_id'
    };
    return `https://www.youporn.com/api/webmasters/${methodAliases[method]}`;
  }

  _makeEmbedUrl(id) {
    return `http://www.youporn.com/embed/${id}`;
  }

  _extractStreamsFromEmbed(body) {
    /* eslint-disable max-len */
    // URL example:
    // https:\/\/ee.ypncdn.com\/201709\/01\/14062051\/720p_1500k_14062051\/YouPorn_-_mia-khalifa-big-tits-arab-pornstar-takes-a-fan-s-virginity.mp4?rate=193k&burst=1400k&validfrom=1524765800&validto=1524780200&hash=EGRxkAOZwod648gfnITHeyb%2Fzi8%3D
    let regexp = /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[a-z]+\.ypncdn\.com[^"']+)/gi;
    /* eslint-enable max-len */

    let urlMatches = body.match(regexp);

    if (!urlMatches || !urlMatches.length) {
      throw new Error('Unable to extract streams from an embed page');
    }

    return urlMatches.map(item => {
      let url = item.match(/http.+/)[0] // Extract the URL
      .replace(/[\\/]+/g, '/') // Normalize the slashes...
      .replace(/(https?:\/)/, '$1/'); // ...but keep the // after "https:"

      let qualityMatch = url.match(/\/(\d+p)/i);
      let quality = qualityMatch && qualityMatch[1].toLowerCase();

      if (url[0] === '/') {
        url = `https:/${url}`;
      }

      return {
        url,
        quality
      };
    });
  }

}

_defineProperty(_defineProperty(YouPorn, "DISPLAY_NAME", 'YouPorn'), "ITEMS_PER_PAGE", 29);

var _default = YouPorn;
exports.default = _default;
//# sourceMappingURL=YouPorn.js.map