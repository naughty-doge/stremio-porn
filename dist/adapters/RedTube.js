"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _HubTrafficAdapter = _interopRequireDefault(require("./HubTrafficAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class RedTube extends _HubTrafficAdapter.default {
  // For some reason Teens doesn't work properly
  _makeMethodUrl(method) {
    return `https://api.redtube.com?data=redtube.Videos.${method}`;
  }

  _makeEmbedUrl(id) {
    return `https://embed.redtube.com?id=${id}`;
  }

  _extractStreamsFromEmbed(body) {
    /* eslint-disable max-len */
    // URL example:
    // https://ce.rdtcdn.com/media/videos/201803/12/4930561/480P_600K_4930561.mp4?a5dcae8e1adc0bdaed975f0...
    let regexp = /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[a-z_-]+\.rdtcdn\.com[^"']+)/gi;
    /* eslint-enable max-len */

    let urlMatches = regexp.exec(body);

    if (!urlMatches || !urlMatches[1]) {
      throw new Error('Unable to extract a stream URL from an embed page');
    }

    let url = urlMatches[1].replace(/[\\/]+/g, '/') // Normalize the slashes...
    .replace(/(https?:\/)/, '$1/'); // ...but keep the // after "https:"

    let qualityMatch = url.match(/\/(\d+p)/i);
    let quality = qualityMatch && qualityMatch[1].toLowerCase();

    if (url[0] === '/') {
      url = `https:/${url}`;
    }

    return [{
      url,
      quality
    }];
  }

}

_defineProperty(_defineProperty(_defineProperty(RedTube, "DISPLAY_NAME", 'RedTube'), "TAGS_TO_SKIP", ['teens']), "ITEMS_PER_PAGE", 20);

var _default = RedTube;
exports.default = _default;
//# sourceMappingURL=RedTube.js.map