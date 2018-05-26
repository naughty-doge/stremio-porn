"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bottleneck = _interopRequireDefault(require("bottleneck"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

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

  _find(query, pagination) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let {
        pages,
        limit,
        skipOnFirstPage
      } = pagination;
      let requests = pages.map(page => {
        return _this._findByPage(query, page);
      });
      let results = yield Promise.all(requests);
      results = [].concat(...results).filter(item => item);
      return results.slice(skipOnFirstPage, skipOnFirstPage + limit);
    })();
  }

  find(request) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      _this2._validateRequest(request);

      let pagination = _this2._paginate(request);

      let {
        query
      } = request;

      if (!query.type) {
        query = _objectSpread({}, query, {
          type: _this2.constructor.SUPPORTED_TYPES[0]
        });
      }

      let results = yield _this2.scheduler.schedule(() => {
        return _this2._find(query, pagination);
      });

      if (results) {
        return results.map(item => _this2._normalizeItem(item));
      } else {
        return [];
      }
    })();
  }

  getItem(request) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      _this3._validateRequest(request, true);

      let {
        type,
        id
      } = request.query;
      let result = yield _this3.scheduler.schedule(() => {
        return _this3._getItem(type, id);
      });
      return result ? [_this3._normalizeItem(result)] : [];
    })();
  }

  getStreams(request) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      _this4._validateRequest(request, true);

      let {
        type,
        id
      } = request.query;
      let results = yield _this4.scheduler.schedule(() => {
        return _this4._getStreams(type, id);
      });

      if (results) {
        return results.map(stream => _this4._normalizeStream(stream));
      } else {
        return [];
      }
    })();
  }

}

_defineProperty(_defineProperty(_defineProperty(BaseAdapter, "SUPPORTED_TYPES", []), "MAX_RESULTS_PER_REQUEST", 100), "MAX_CONCURRENT_REQUESTS", 3);

var _default = BaseAdapter;
exports.default = _default;
//# sourceMappingURL=BaseAdapter.js.map