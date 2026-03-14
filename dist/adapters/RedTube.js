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
    // Try absolute rdtcdn.com URLs (old format)

    /* eslint-disable max-len */
    let absoluteRegexp = /videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[a-z_-]+\.rdtcdn\.com[^"']+)/gi;
    /* eslint-enable max-len */

    let absoluteMatch = absoluteRegexp.exec(body);

    if (absoluteMatch && absoluteMatch[1]) {
      let url = absoluteMatch[1].replace(/[\\/]+/g, '/').replace(/(https?:\/)/, '$1/');

      if (url[0] === '/') {
        url = `https:/${url}`;
      }

      let qualityMatch = url.match(/\/(\d+p)/i);
      return [{
        url,
        quality: qualityMatch && qualityMatch[1].toLowerCase()
      }];
    } // Try relative signed URLs (new format), slashes are JSON-escaped as \/


    let mp4Regexp = /videoUrl["']?\s*:\s*["']?(\\?\/media\\?\/mp4\?[^"']+)/gi;
    let mp4Match = mp4Regexp.exec(body);

    if (mp4Match && mp4Match[1]) {
      let url = `https://embed.redtube.com${mp4Match[1].replace(/\\/g, '')}`;
      return [{
        url
      }];
    }

    let hlsRegexp = /videoUrl["']?\s*:\s*["']?(\\?\/media\\?\/hls\?[^"']+)/gi;
    let hlsMatch = hlsRegexp.exec(body);

    if (hlsMatch && hlsMatch[1]) {
      let url = `https://embed.redtube.com${hlsMatch[1].replace(/\\/g, '')}`;
      return [{
        url
      }];
    }

    throw new Error('Unable to extract a stream URL from an embed page');
  }

}

_defineProperty(_defineProperty(_defineProperty(RedTube, "DISPLAY_NAME", 'RedTube'), "TAGS_TO_SKIP", ['teens']), "ITEMS_PER_PAGE", 20);

var _default = RedTube;
exports.default = _default;
//# sourceMappingURL=RedTube.js.map