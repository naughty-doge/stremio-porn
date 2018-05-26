"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cacheManager = _interopRequireDefault(require("cache-manager"));

var _cacheManagerRedisStore = _interopRequireDefault(require("cache-manager-redis-store"));

var _HttpClient = _interopRequireDefault(require("./HttpClient"));

var _PornHub = _interopRequireDefault(require("./adapters/PornHub"));

var _RedTube = _interopRequireDefault(require("./adapters/RedTube"));

var _YouPorn = _interopRequireDefault(require("./adapters/YouPorn"));

var _SpankWire = _interopRequireDefault(require("./adapters/SpankWire"));

var _PornCom = _interopRequireDefault(require("./adapters/PornCom"));

var _Chaturbate = _interopRequireDefault(require("./adapters/Chaturbate"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// EPorner has restricted video downloads to 30 per day per guest
// import EPorner from './adapters/EPorner'
const ID = 'porn_id';
const SORT_PROP_PREFIX = 'popularities.porn.';
const CACHE_PREFIX = 'stremio-porn|'; // Making multiple requests to multiple adapters for different types
// and then aggregating them is a lot of work,
// so we only support 1 adapter per request for now.

const MAX_ADAPTERS_PER_REQUEST = 1;
const ADAPTERS = [_PornHub.default, _RedTube.default, _YouPorn.default, _SpankWire.default, _PornCom.default, _Chaturbate.default];
const SORTS = ADAPTERS.map(({
  name,
  DISPLAY_NAME,
  SUPPORTED_TYPES
}) => ({
  name: `Porn: ${DISPLAY_NAME}`,
  prop: `${SORT_PROP_PREFIX}${name}`,
  types: SUPPORTED_TYPES
}));
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
  let [adapter, type, id] = pornId.split(':').pop().split('-');
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
  }

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

    if (adapters.length && !adapters.includes(adapter)) {
      throw new Error(`Request sort and porn_id adapters do not match (${adapter})`);
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
  constructor(options) {
    let httpClient = new _HttpClient.default(options);
    this.adapters = ADAPTERS.map(Adapter => new Adapter(httpClient));

    if (options.cache === '1') {
      this.cache = _cacheManager.default.caching({
        store: 'memory'
      });
    } else if (options.cache && options.cache !== '0') {
      this.cache = _cacheManager.default.caching({
        store: _cacheManagerRedisStore.default,
        url: options.cache
      });
    }
  }

  _getAdaptersForRequest(request) {
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

    return matchingAdapters.slice(0, MAX_ADAPTERS_PER_REQUEST);
  }

  _invokeAdapterMethod(adapter, method, request, idProp) {
    return _asyncToGenerator(function* () {
      let results = yield adapter[method](request);
      return results.map(result => {
        return normalizeResult(adapter, result, idProp);
      });
    })();
  } // Aggregate method that dispatches requests to matching adapters


  _invokeMethod(methodName, rawRequest, idProp) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let request = normalizeRequest(rawRequest);

      let adapters = _this._getAdaptersForRequest(request);

      if (!adapters.length) {
        throw new Error('Couldn\'t find suitable adapters for a request');
      }

      let results = [];

      for (let adapter of adapters) {
        let adapterResults = yield _this._invokeAdapterMethod(adapter, methodName, request, idProp);
        results.push(adapterResults);
      }

      return mergeResults(results, request.limit);
    })();
  } // This is a public wrapper around the private method
  // that implements caching and result normalization


  invokeMethod(methodName, rawRequest) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let {
        adapterMethod,
        cacheTtl,
        idProp,
        expectsArray
      } = METHODS[methodName];

      let invokeMethod =
      /*#__PURE__*/
      function () {
        var _ref = _asyncToGenerator(function* () {
          let result = yield _this2._invokeMethod(adapterMethod, rawRequest, idProp);
          result = expectsArray ? result : result[0];
          return result;
        });

        return function invokeMethod() {
          return _ref.apply(this, arguments);
        };
      }();

      if (_this2.cache) {
        let cacheKey = CACHE_PREFIX + JSON.stringify(rawRequest);
        let cacheOptions = {
          ttl: cacheTtl
        };
        return _this2.cache.wrap(cacheKey, invokeMethod, cacheOptions);
      } else {
        return invokeMethod();
      }
    })();
  }

}

_defineProperty(_defineProperty(_defineProperty(PornClient, "ID", ID), "ADAPTERS", ADAPTERS), "SORTS", SORTS);

var _default = PornClient;
exports.default = _default;
//# sourceMappingURL=PornClient.js.map