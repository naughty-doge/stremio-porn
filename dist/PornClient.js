"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cacheManager = _interopRequireDefault(require("cache-manager"));

var _HttpClient = _interopRequireDefault(require("./HttpClient"));

var _DebridClient = _interopRequireDefault(require("./DebridClient"));

var _PornHub = _interopRequireDefault(require("./adapters/PornHub"));

var _XVideos = _interopRequireDefault(require("./adapters/XVideos"));

var _XHamster = _interopRequireDefault(require("./adapters/XHamster"));

var _Chaturbate = _interopRequireDefault(require("./adapters/Chaturbate"));

var _UsenetStreamer = _interopRequireDefault(require("./adapters/UsenetStreamer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// EPorner has restricted video downloads to 30 per day per guest
// import EPorner from './adapters/EPorner'
// RedTube, YouPorn, SpankWire: HubTraffic API deprecated
// PornCom: API no longer available
const ID = 'porn_id';
const SORT_PROP_PREFIX = 'popularities.porn.';
const CACHE_PREFIX = 'goonhub|'; // Making multiple requests to multiple adapters for different types
// and then aggregating them is a lot of work,
// so we only support 1 adapter per request for now.

const MAX_ADAPTERS_PER_REQUEST = 1;
const BASE_ADAPTERS = [_PornHub.default, _XVideos.default, _XHamster.default, _Chaturbate.default];

const isUsenetAdapter = (adapter, includeClass = false) => {
  return adapter instanceof _UsenetStreamer.default || includeClass && adapter === _UsenetStreamer.default;
};

function buildSorts(adapters) {
  return adapters.map(({
    name,
    DISPLAY_NAME,
    SUPPORTED_TYPES
  }) => ({
    name: `Porn: ${DISPLAY_NAME}`,
    prop: `${SORT_PROP_PREFIX}${name}`,
    types: SUPPORTED_TYPES
  }));
}

function buildCatalogs(adapters) {
  return adapters.reduce((catalogs, Adapter) => {
    if (isUsenetAdapter(Adapter, true)) {
      return catalogs;
    }

    Adapter.SUPPORTED_TYPES.forEach(type => {
      catalogs.push({
        type,
        id: `${Adapter.name.toLowerCase()}-${type}`,
        name: Adapter.DISPLAY_NAME,
        extra: [{
          name: 'search'
        }, {
          name: 'skip'
        }, {
          name: 'genre',
          isRequired: false
        }],
        extraSupported: ['search', 'skip', 'genre']
      });
    });
    return catalogs;
  }, []);
}

const SEARCH_CATALOG_PREFIX = 'goonhub-search-';

function buildSearchCatalogs(adapters) {
  let types = new Set();
  adapters.forEach(Adapter => {
    if (!isUsenetAdapter(Adapter, true)) {
      Adapter.SUPPORTED_TYPES.forEach(type => types.add(type));
    }
  });
  return Array.from(types).map(type => ({
    type,
    id: `${SEARCH_CATALOG_PREFIX}${type}`,
    name: 'GoonHub Search',
    extra: [{
      name: 'search',
      isRequired: true
    }, {
      name: 'skip'
    }],
    extraSupported: ['search', 'skip']
  }));
}

const METHODS = {
  'stream.find': {
    adapterMethod: 'getStreams',
    cacheTtl: 300,
    idProp: ID,
    expectsArray: true
  },
  'meta.find': {
    adapterMethod: 'find',
    cacheTtl: 300,
    idProp: 'id',
    expectsArray: true
  },
  'meta.search': {
    adapterMethod: 'find',
    cacheTtl: 3600,
    idProp: 'id',
    expectsArray: true
  },
  'meta.get': {
    adapterMethod: 'getItem',
    cacheTtl: 300,
    idProp: 'id',
    expectsArray: false
  }
};

function makePornId(adapter, type, id) {
  return `${ID}:${adapter}-${type}-${id}`;
}

function parsePornId(pornId) {
  let str = pornId.split(':').pop();
  let firstDash = str.indexOf('-');
  let secondDash = str.indexOf('-', firstDash + 1);
  let adapter = str.substring(0, firstDash);
  let type = str.substring(firstDash + 1, secondDash);
  let id = str.substring(secondDash + 1);
  return {
    adapter,
    type,
    id
  };
}

function normalizeRequest(request) {
  let {
    query,
    sort,
    limit,
    skip
  } = request;
  let adapters = [];

  if (sort) {
    adapters = Object.keys(sort).filter(p => p.startsWith(SORT_PROP_PREFIX)).map(p => p.slice(SORT_PROP_PREFIX.length));
  } // Support plain string queries by converting them to name-based search objects


  if (typeof query === 'string') {
    query = {
      search: query
    };
  } else if (query) {
    query = _objectSpread({}, query);
  } else {
    query = {};
  }

  if (query.porn_id) {
    let {
      adapter,
      type,
      id
    } = parsePornId(query.porn_id);

    if (type && query.type && type !== query.type) {
      throw new Error(`Request query and porn_id types do not match (${type}, ${query.type})`);
    }

    adapters = [adapter];
    query.type = type;
    query.id = id;
  }

  return {
    query,
    adapters,
    skip,
    limit
  };
}

function normalizeResult(adapter, item, idProp = 'id') {
  let newItem = _objectSpread({}, item);

  newItem[idProp] = makePornId(adapter.constructor.name, item.type, item.id);
  return newItem;
}

function mergeResults(results) {
  // TODO: limit
  return results.reduce((results, adapterResults) => {
    results.push(...adapterResults);
    return results;
  }, []);
}

class PornClient {
  static getAdapters(options = {}) {
    let adapters = [...BASE_ADAPTERS];

    if (options.usenetStreamerUrl) {
      adapters.push(_UsenetStreamer.default);
    }

    return adapters;
  }

  static getSorts(options = {}, adapters = this.getAdapters(options)) {
    return buildSorts(adapters);
  }

  static getCatalogs(options = {}, adapters = this.getAdapters(options)) {
    return buildCatalogs(adapters);
  }

  static getSearchCatalogs(options = {}, adapters = this.getAdapters(options)) {
    return buildSearchCatalogs(adapters);
  }

  static getIdPrefixes(options = {}, adapters = this.getAdapters(options)) {
    let prefixes = [];

    if (options.usenetStreamerUrl && adapters.some(adapter => isUsenetAdapter(adapter, true))) {
      prefixes.push(..._UsenetStreamer.default.ID_PREFIXES);
    }

    return prefixes;
  }

  constructor(options) {
    let httpClient = new _HttpClient.default(options);
    this.debridClient = new _DebridClient.default(httpClient, {
      realDebridToken: options.realDebridToken,
      torboxToken: options.torboxToken
    });
    this.adapterClasses = PornClient.getAdapters(options);
    this.adapters = this.adapterClasses.map(Adapter => {
      let adapterOptions = {};

      if (Adapter === _UsenetStreamer.default) {
        adapterOptions = {
          baseUrl: options.usenetStreamerUrl
        };
      }

      return new Adapter(httpClient, adapterOptions);
    });
    this.sorts = buildSorts(this.adapterClasses);
    this.catalogs = buildCatalogs(this.adapterClasses);

    if (options.cache && options.cache !== '0') {
      this.cache = _cacheManager.default.caching({
        store: 'memory'
      });
    }
  }

  _getAdaptersForRequest(request, adapterMethod) {
    let {
      query,
      adapters
    } = request;
    let {
      type
    } = query;
    let matchingAdapters = this.adapters;

    if (adapters.length) {
      matchingAdapters = matchingAdapters.filter(adapter => {
        return adapters.includes(adapter.constructor.name);
      });
    }

    if (type) {
      matchingAdapters = matchingAdapters.filter(adapter => {
        return adapter.constructor.SUPPORTED_TYPES.includes(type);
      });
    }

    if (adapterMethod === 'getStreams') {
      let usenetAdapter = query.id && matchingAdapters.find(adapter => {
        return isUsenetAdapter(adapter) && adapter.supportsId(query.id);
      }) || null;
      matchingAdapters = usenetAdapter ? [usenetAdapter] : matchingAdapters.filter(adapter => !isUsenetAdapter(adapter));
    } else {
      matchingAdapters = matchingAdapters.filter(adapter => !isUsenetAdapter(adapter));
    }

    return matchingAdapters.slice(0, MAX_ADAPTERS_PER_REQUEST);
  }

  async _invokeAdapterMethod(adapter, method, request, idProp) {
    try {
      let results = await adapter[method](request);

      if (method === 'getStreams') {
        results = await this.debridClient.unrestrictStreams(results);
      }

      return results.map(result => {
        return normalizeResult(adapter, result, idProp);
      });
    } catch (err) {
      return [];
    }
  } // Aggregate method that dispatches requests to matching adapters


  async _invokeMethod(adapterMethod, rawRequest, idProp) {
    let request = normalizeRequest(rawRequest);

    let adapters = this._getAdaptersForRequest(request, adapterMethod);

    if (!adapters.length) {
      return [];
    }

    let results = [];

    for (let adapter of adapters) {
      let adapterResults = await this._invokeAdapterMethod(adapter, adapterMethod, request, idProp);
      results.push(adapterResults);
    }

    return mergeResults(results, request.limit);
  } // This is a public wrapper around the private method
  // that implements caching and result normalization


  async invokeMethod(methodName, rawRequest) {
    let {
      adapterMethod,
      cacheTtl,
      idProp,
      expectsArray
    } = METHODS[methodName];

    let invokeMethod = async () => {
      let result = await this._invokeMethod(adapterMethod, rawRequest, idProp);
      result = expectsArray ? result : result[0];
      return result;
    };

    if (this.cache) {
      let cacheKey = CACHE_PREFIX + JSON.stringify(rawRequest);
      let cacheOptions = {
        ttl: cacheTtl
      };
      return this.cache.wrap(cacheKey, invokeMethod, cacheOptions);
    } else {
      return invokeMethod();
    }
  }

}

_defineProperty(_defineProperty(_defineProperty(PornClient, "ID", ID), "SORT_PROP_PREFIX", SORT_PROP_PREFIX), "SEARCH_CATALOG_PREFIX", SEARCH_CATALOG_PREFIX);

var _default = PornClient;
exports.default = _default;
//# sourceMappingURL=PornClient.js.map