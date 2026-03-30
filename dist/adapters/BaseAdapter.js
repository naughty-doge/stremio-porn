"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bottleneck = _interopRequireDefault(require("bottleneck"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Contains some common methods as well as public wrappers
// that prepare requests, redirect them to private methods
// and normalize results
class BaseAdapter {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.scheduler = new _bottleneck.default({
      maxConcurrent: this.constructor.MAX_CONCURRENT_REQUESTS
    });
  }

  _normalizeItem(item) {
    return item;
  }

  _normalizeStream(stream) {
    if (stream.name) {
      return stream;
    } else {
      return _objectSpread({}, stream, {
        name: this.constructor.name
      });
    }
  }

  _paginate(request) {
    let itemsPerPage = this.constructor.ITEMS_PER_PAGE || Infinity;
    let {
      skip = 0,
      limit = itemsPerPage
    } = request;
    limit = Math.min(limit, this.constructor.MAX_RESULTS_PER_REQUEST);
    itemsPerPage = Math.min(itemsPerPage, limit);
    let firstPage = Math.ceil((skip + 0.1) / itemsPerPage) || 1;
    let pageCount = Math.ceil(limit / itemsPerPage);
    let pages = [];

    for (let i = firstPage; pages.length < pageCount; i++) {
      pages.push(i);
    }

    return {
      pages,
      skip,
      limit,
      skipOnFirstPage: skip % itemsPerPage
    };
  }

  _validateRequest(request, typeRequired) {
    let {
      SUPPORTED_TYPES
    } = this.constructor;

    if (typeof request !== 'object') {
      throw new Error(`A request must be an object, ${typeof request} given`);
    }

    if (!request.query) {
      throw new Error('Request query must not be empty');
    }

    if (typeRequired && !request.query.type) {
      throw new Error('Content type must be specified');
    }

    if (request.query.type && !SUPPORTED_TYPES.includes(request.query.type)) {
      throw new Error(`Content type ${request.query.type} is not supported`);
    }
  }

  async _find(query, pagination) {
    let {
      pages,
      limit,
      skipOnFirstPage
    } = pagination;
    let requests = pages.map(page => {
      return this._findByPage(query, page);
    });
    let results = await Promise.all(requests);
    results = [].concat(...results).filter(item => item);
    return results.slice(skipOnFirstPage, skipOnFirstPage + limit);
  }

  async find(request) {
    this._validateRequest(request);

    let pagination = this._paginate(request);

    let {
      query
    } = request;

    if (!query.type) {
      query = _objectSpread({}, query, {
        type: this.constructor.SUPPORTED_TYPES[0]
      });
    }

    let results = await this.scheduler.schedule(() => {
      return this._find(query, pagination);
    });

    if (results) {
      return results.map(item => this._normalizeItem(item));
    } else {
      return [];
    }
  }

  async getItem(request) {
    this._validateRequest(request, true);

    let {
      type,
      id
    } = request.query;
    let result = await this.scheduler.schedule(() => {
      return this._getItem(type, id);
    });
    return result ? [this._normalizeItem(result)] : [];
  }

  async getStreams(request) {
    this._validateRequest(request, true);

    let {
      type,
      id
    } = request.query;
    let results = await this.scheduler.schedule(() => {
      return this._getStreams(type, id);
    });

    if (results) {
      return results.map(stream => this._normalizeStream(stream));
    } else {
      return [];
    }
  }

}

_defineProperty(_defineProperty(_defineProperty(BaseAdapter, "SUPPORTED_TYPES", []), "MAX_RESULTS_PER_REQUEST", 100), "MAX_CONCURRENT_REQUESTS", 3);

var _default = BaseAdapter;
exports.default = _default;
//# sourceMappingURL=BaseAdapter.js.map