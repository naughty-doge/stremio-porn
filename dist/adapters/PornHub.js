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
    // Try multiple patterns for different PornHub embed formats
    let patterns = [/videoUrl["']?\s*:\s*["']?(https?:\\?\/\\?\/[^"',\s]+\.mp4[^"',\s]*)/gi, /"url"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/gi, /setVideoHLS\(['"]([^'"]+)['"]\)/gi, /hlsManifestUrl["']?\s*:\s*["']?([^"',\s]+)/gi];

    for (let regexp of patterns) {
      let match = regexp.exec(body);

      if (match && match[1]) {
        let url = match[1].replace(/\\\/\\/g, '/').replace(/[\\/]+/g, '/').replace(/(https?:\/)/, '$1/');
        if (url[0] === '/') url = `https:/${url}`;
        return [{
          url
        }];
      }
    }

    throw new Error('Unable to extract a stream URL from an embed page');
  }

}

_defineProperty(_defineProperty(_defineProperty(PornHub, "DISPLAY_NAME", 'PornHub'), "ITEMS_PER_PAGE", 30), "VIDEO_ID_PARAMETER", 'id');

var _default = PornHub;
exports.default = _default;
//# sourceMappingURL=PornHub.js.map