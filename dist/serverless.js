"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handler;

var _stremioAddonSdk = require("stremio-addon-sdk");

var _addon = _interopRequireWildcard(require("./addon"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const CACHE = process.env.GOONHUB_CACHE || '1';
const PROXY = process.env.GOONHUB_PROXY || process.env.HTTPS_PROXY;
let router = (0, _stremioAddonSdk.getRouter)(_addon.default);

function handler(req, res) {
  if (req.url === '/api/status') {
    let status = {
      manifest: {
        name: _addon.MANIFEST.name,
        version: _addon.MANIFEST.version,
        description: _addon.MANIFEST.description,
        catalogs: _addon.MANIFEST.catalogs
      },
      config: {
        cache: CACHE !== '0',
        proxy: !!PROXY
      }
    };
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(status));
    return;
  }

  router(req, res, () => {
    res.statusCode = 404;
    res.end();
  });
}
//# sourceMappingURL=serverless.js.map