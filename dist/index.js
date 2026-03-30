"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _http = _interopRequireDefault(require("http"));

var _stremioAddonSdk = require("stremio-addon-sdk");

var _serveStatic = _interopRequireDefault(require("serve-static"));

var _chalk = _interopRequireDefault(require("chalk"));

var _addon = _interopRequireWildcard(require("./addon"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const STATIC_DIR = 'static';
const PORT = process.env.GOONHUB_PORT || process.env.PORT || '80';
const PROXY = process.env.GOONHUB_PROXY || process.env.HTTPS_PROXY;
const CACHE = process.env.GOONHUB_CACHE || '1';
const EMAIL = process.env.GOONHUB_EMAIL || process.env.EMAIL;
const IS_PROD = process.env.NODE_ENV === 'production';
let router = (0, _stremioAddonSdk.getRouter)(_addon.default);

let server = _http.default.createServer((req, res) => {
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

  (0, _serveStatic.default)(STATIC_DIR)(req, res, () => {
    router(req, res, () => res.end());
  });
});

server.on('listening', () => {
  let id = _addon.MANIFEST.id;
  let values = {
    id: IS_PROD ? _chalk.default.green(id) : _chalk.default.green(id),
    email: EMAIL ? _chalk.default.green(EMAIL) : _chalk.default.red('undefined'),
    env: IS_PROD ? _chalk.default.green('production') : _chalk.default.green('development'),
    proxy: PROXY ? _chalk.default.green(PROXY) : _chalk.default.red('off'),
    cache: CACHE === '0' ? _chalk.default.red('off') : _chalk.default.green('on') // eslint-disable-next-line no-console

  };
  console.log(`
    ${_addon.MANIFEST.name} v${_addon.MANIFEST.version} is listening on port ${PORT}

    Addon Id:    ${values.id}
    Email:       ${values.email}
    Environment: ${values.env}
    Proxy:       ${values.proxy}
    Cache:       ${values.cache}
    `);
}).listen(PORT);
var _default = server;
exports.default = _default;
//# sourceMappingURL=index.js.map