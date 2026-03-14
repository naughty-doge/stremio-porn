"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _http = _interopRequireDefault(require("http"));

var _url = require("url");

var _stremioAddons = _interopRequireDefault(require("stremio-addons"));

var _serveStatic = _interopRequireDefault(require("serve-static"));

var _chalk = _interopRequireDefault(require("chalk"));

var _package = _interopRequireDefault(require("../package.json"));

var _PornClient = _interopRequireDefault(require("./PornClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const SUPPORTED_METHODS = ['stream.find', 'meta.find', 'meta.search', 'meta.get'];
const STATIC_DIR = 'static';
const DEFAULT_ID = 'stremio_porn';
const ID = process.env.STREMIO_PORN_ID || DEFAULT_ID;
const ENDPOINT = process.env.STREMIO_PORN_ENDPOINT || 'http://localhost';
const PORT = process.env.STREMIO_PORN_PORT || process.env.PORT || '80';
const PROXY = process.env.STREMIO_PORN_PROXY || process.env.HTTPS_PROXY;
const CACHE = process.env.STREMIO_PORN_CACHE || process.env.REDIS_URL || '1';
const EMAIL = process.env.STREMIO_PORN_EMAIL || process.env.EMAIL;
const IS_PROD = process.env.NODE_ENV === 'production';

if (IS_PROD && ID === DEFAULT_ID) {
  // eslint-disable-next-line no-console
  console.error(_chalk.default.red('\nWhen running in production, a non-default addon identifier must be specified\n'));
  process.exit(1);
}

let availableSites = _PornClient.default.ADAPTERS.map(a => a.DISPLAY_NAME).join(', ');

const MANIFEST = {
  name: 'Porn',
  id: ID,
  version: _package.default.version,
  description: `\
Time to unsheathe your sword! \
Watch porn videos and webcam streams from ${availableSites}\
`,
  types: ['movie', 'tv'],
  idProperty: _PornClient.default.ID,
  dontAnnounce: !IS_PROD,
  sorts: _PornClient.default.SORTS,
  // The docs mention `contactEmail`, but the template uses `email`
  email: EMAIL,
  contactEmail: EMAIL,
  endpoint: `${ENDPOINT}/stremioget/stremio/v1`,
  logo: `${ENDPOINT}/logo.png`,
  icon: `${ENDPOINT}/logo.png`,
  background: `${ENDPOINT}/bg.jpg`,
  // OBSOLETE: used in pre-4.0 stremio instead of idProperty/types
  filter: {
    [`query.${_PornClient.default.ID}`]: {
      $exists: true
    },
    'query.type': {
      $in: ['movie', 'tv']
    }
  } // Manifest for the new Stremio addon SDK REST API (v4.4+)

};

const SDK_CATALOGS = _PornClient.default.ADAPTERS.reduce((catalogs, Adapter) => {
  Adapter.SUPPORTED_TYPES.forEach(type => {
    catalogs.push({
      type,
      id: Adapter.name,
      name: `Porn: ${Adapter.DISPLAY_NAME}`
    });
  });
  return catalogs;
}, []);

const SDK_MANIFEST = {
  id: ID,
  version: _package.default.version,
  name: MANIFEST.name,
  description: MANIFEST.description,
  logo: MANIFEST.logo,
  background: MANIFEST.background,
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'tv'],
  idPrefixes: [`${_PornClient.default.ID}:`],
  catalogs: SDK_CATALOGS
};

function sendJson(res, data) {
  let body = JSON.stringify(data);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
  res.end(body);
}

function makeMethod(client, methodName) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(function* (request, cb) {
        let response;
        let error;

        try {
          response = yield client.invokeMethod(methodName, request);
        } catch (err) {
          error = err;
          /* eslint-disable no-console */

          console.error( // eslint-disable-next-line prefer-template
          _chalk.default.gray(new Date().toLocaleString()) + ' An error has occurred while processing ' + `the following request to ${methodName}:`);
          console.error(request);
          console.error(err);
          /* eslint-enable no-console */
        }

        cb(error, response);
      });

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }()
  );
}

function makeMethods(client, methodNames) {
  return methodNames.reduce((methods, methodName) => {
    methods[methodName] = makeMethod(client, methodName);
    return methods;
  }, {});
}

let client = new _PornClient.default({
  proxy: PROXY,
  cache: CACHE
});
let methods = makeMethods(client, SUPPORTED_METHODS);
let addon = new _stremioAddons.default.Server(methods, MANIFEST);

let server = _http.default.createServer((req, res) => {
  let {
    pathname
  } = (0, _url.parse)(req.url);

  if (req.method === 'GET') {
    // New Stremio addon SDK (v4.4+) REST API endpoints.
    // The old stremio-addons middleware returns the HTML landing page for any
    // GET request whose path doesn't end in "q.json", so we handle these
    // routes before the old middleware can intercept them.
    if (pathname === '/manifest.json') {
      sendJson(res, SDK_MANIFEST);
      return;
    }

    let streamMatch = pathname.match(/^\/stream\/([^/]+)\/(.+)\.json$/);

    if (streamMatch) {
      let type = streamMatch[1];
      let id = decodeURIComponent(streamMatch[2]);
      client.invokeMethod('stream.find', {
        query: {
          [_PornClient.default.ID]: id,
          type
        }
      }).then(streams => sendJson(res, {
        streams: streams || []
      })).catch(() => sendJson(res, {
        streams: []
      }));
      return;
    }

    let metaMatch = pathname.match(/^\/meta\/([^/]+)\/(.+)\.json$/);

    if (metaMatch) {
      let type = metaMatch[1];
      let id = decodeURIComponent(metaMatch[2]);
      client.invokeMethod('meta.get', {
        query: {
          [_PornClient.default.ID]: id,
          type
        }
      }).then(meta => sendJson(res, {
        meta: meta || null
      })).catch(() => sendJson(res, {
        meta: null
      }));
      return;
    }

    let catalogMatch = pathname.match(/^\/catalog\/([^/]+)\/([^/]+)\.json$/);

    if (catalogMatch) {
      let type = catalogMatch[1];
      let catalogId = catalogMatch[2];
      let sort = {
        [`popularities.porn.${catalogId}`]: -1
      };
      client.invokeMethod('meta.find', {
        query: {
          type
        },
        sort
      }).then(metas => sendJson(res, {
        metas: metas || []
      })).catch(() => sendJson(res, {
        metas: []
      }));
      return;
    }
  }

  (0, _serveStatic.default)(STATIC_DIR)(req, res, () => {
    addon.middleware(req, res, () => res.end());
  });
});

server.on('listening', () => {
  let values = {
    endpoint: _chalk.default.green(MANIFEST.endpoint),
    id: ID === DEFAULT_ID ? _chalk.default.red(ID) : _chalk.default.green(ID),
    email: EMAIL ? _chalk.default.green(EMAIL) : _chalk.default.red('undefined'),
    env: IS_PROD ? _chalk.default.green('production') : _chalk.default.green('development'),
    proxy: PROXY ? _chalk.default.green(PROXY) : _chalk.default.red('off'),
    cache: CACHE === '0' ? _chalk.default.red('off') : _chalk.default.green(CACHE === '1' ? 'on' : CACHE) // eslint-disable-next-line no-console

  };
  console.log(`
    ${MANIFEST.name} Addon is listening on port ${PORT}

    Endpoint:    ${values.endpoint}
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