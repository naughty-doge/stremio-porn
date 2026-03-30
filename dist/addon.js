"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getClient = getClient;
exports.baseClientOptions = exports.MANIFEST = exports.default = void 0;

var _stremioAddonSdk = require("stremio-addon-sdk");

var _package = _interopRequireDefault(require("../package.json"));

var _PornClient = _interopRequireDefault(require("./PornClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const ID = process.env.GOONHUB_ID || 'org.goonhub';
const ENDPOINT = process.env.GOONHUB_ENDPOINT || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost');
const PROXY = process.env.GOONHUB_PROXY || process.env.HTTPS_PROXY;
const CACHE = process.env.GOONHUB_CACHE || '1';
const EMAIL = process.env.GOONHUB_EMAIL || process.env.EMAIL;
const USENET_STREAMER = process.env.GOONHUB_USENET_STREAMER;
let baseClientOptions = {
  proxy: PROXY,
  cache: CACHE,
  usenetStreamerUrl: USENET_STREAMER
};
exports.baseClientOptions = baseClientOptions;

let adapterClasses = _PornClient.default.getAdapters(baseClientOptions);

let availableSites = adapterClasses.map(a => a.DISPLAY_NAME).join(', '); // Map lowercase adapter name to actual class name
// e.g. 'pornhub' -> 'PornHub'

let adapterNameMap = {};
adapterClasses.forEach(A => {
  adapterNameMap[A.name.toLowerCase()] = A.name;
});
let catalogs = [..._PornClient.default.getCatalogs(baseClientOptions, adapterClasses), ..._PornClient.default.getSearchCatalogs(baseClientOptions, adapterClasses)];
let idPrefixes = [`${_PornClient.default.ID}:`, ..._PornClient.default.getIdPrefixes(baseClientOptions, adapterClasses)];
const MANIFEST = {
  id: ID,
  version: _package.default.version,
  name: 'GoonHub',
  description: `\
Time to unsheathe your sword! \
Watch porn videos and webcam streams from ${availableSites}\
`,
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'tv'],
  catalogs,
  idPrefixes,
  contactEmail: EMAIL,
  logo: `${ENDPOINT}/logo.png`,
  background: `${ENDPOINT}/bg.jpg`,
  behaviorHints: {
    configurable: true,
    configurationRequired: false
  },
  config: [{
    key: 'realDebridToken',
    type: 'text',
    title: 'Real-Debrid API Token'
  }, {
    key: 'torboxToken',
    type: 'text',
    title: 'Torbox API Token'
  }]
};
exports.MANIFEST = MANIFEST;
let builder = new _stremioAddonSdk.addonBuilder(MANIFEST); // Cache for per-config PornClient instances

let clientCache = {};
let clientCacheKeys = [];
const MAX_CLIENTS = 100;

function getClient(config) {
  let token = config && config.realDebridToken || config && config.torboxToken;

  if (!token) {
    return new _PornClient.default(baseClientOptions);
  }

  let cacheKey = JSON.stringify(config);

  if (clientCache[cacheKey]) {
    return clientCache[cacheKey];
  }

  let clientOptions = _objectSpread({}, baseClientOptions, {
    realDebridToken: config.realDebridToken,
    torboxToken: config.torboxToken
  });

  let client = new _PornClient.default(clientOptions);
  clientCache[cacheKey] = client;
  clientCacheKeys.push(cacheKey);

  while (clientCacheKeys.length > MAX_CLIENTS) {
    let oldKey = clientCacheKeys.shift();
    delete clientCache[oldKey];
  }

  return client;
}

function parseAdapterFromCatalogId(catalogId) {
  // Catalog IDs are like 'pornhub-movie', 'chaturbate-tv'
  // Extract adapter name (everything before the last dash+type)
  let parts = catalogId.split('-');
  let type = parts.pop();
  let adapterKey = parts.join('-');
  return adapterNameMap[adapterKey] || adapterKey;
}

function mapMeta(item) {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    poster: item.poster,
    posterShape: item.posterShape,
    banner: item.banner,
    genre: item.genre,
    year: item.year,
    description: item.description,
    runtime: item.runtime,
    website: item.website,
    popularity: item.popularity
  };
}

builder.defineCatalogHandler(async ({
  type,
  id,
  extra,
  config
}) => {
  try {
    let client = getClient(config); // Unified search catalog: search across all adapters for this type

    if (id.startsWith(_PornClient.default.SEARCH_CATALOG_PREFIX)) {
      if (!extra.search) {
        return {
          metas: []
        };
      }

      let allMetas = [];
      let searchAdapters = adapterClasses.filter(A => {
        return A.SUPPORTED_TYPES.includes(type);
      });
      let promises = searchAdapters.map(async A => {
        try {
          let sortProp = `${_PornClient.default.SORT_PROP_PREFIX}${A.name}`;
          let request = {
            query: {
              type,
              search: extra.search
            },
            sort: {
              [sortProp]: -1
            },
            skip: parseInt(extra.skip, 10) || 0,
            limit: 10
          };
          return await client.invokeMethod('meta.search', request);
        } catch (err) {
          return [];
        }
      });
      let results = await Promise.all(promises);
      results.forEach(adapterResults => {
        if (adapterResults && adapterResults.length) {
          allMetas.push(...adapterResults);
        }
      });
      return {
        metas: allMetas.map(mapMeta)
      };
    } // Per-adapter catalog


    let adapterName = parseAdapterFromCatalogId(id);
    let sortProp = `${_PornClient.default.SORT_PROP_PREFIX}${adapterName}`;
    let request = {
      query: {
        type,
        search: extra.search || undefined,
        genre: extra.genre || undefined
      },
      sort: {
        [sortProp]: -1
      },
      skip: parseInt(extra.skip, 10) || 0,
      limit: parseInt(extra.limit, 10) || undefined
    };
    let methodName = extra.search ? 'meta.search' : 'meta.find';
    let results = await client.invokeMethod(methodName, request);
    return {
      metas: (results || []).map(mapMeta)
    };
  } catch (err) {
    return {
      metas: []
    };
  }
});
builder.defineMetaHandler(async ({
  type,
  id,
  config
}) => {
  try {
    let client = getClient(config);
    let request = {
      query: {
        type,
        [_PornClient.default.ID]: id
      }
    };
    let result = await client.invokeMethod('meta.get', request);

    if (!result) {
      return {
        meta: null
      };
    }

    return {
      meta: {
        id: result.id,
        type: result.type,
        name: result.name,
        poster: result.poster,
        posterShape: result.posterShape,
        banner: result.banner,
        genre: result.genre,
        year: result.year,
        description: result.description,
        runtime: result.runtime,
        website: result.website,
        popularity: result.popularity
      }
    };
  } catch (err) {
    return {
      meta: null
    };
  }
});
builder.defineStreamHandler(async ({
  type,
  id,
  config
}) => {
  try {
    let client = getClient(config);
    let request = {
      query: {
        type,
        [_PornClient.default.ID]: id
      }
    };
    let results = await client.invokeMethod('stream.find', request);
    return {
      streams: (results || []).map(stream => ({
        url: stream.url,
        title: stream.title,
        name: stream.name,
        availability: stream.availability,
        live: stream.live,
        isFree: stream.isFree
      }))
    };
  } catch (err) {
    return {
      streams: []
    };
  }
});
let addonInterface = builder.getInterface();
var _default = addonInterface;
exports.default = _default;
//# sourceMappingURL=addon.js.map