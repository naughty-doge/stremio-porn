function paginate(itemsPerPage, skip, limit) {
  let firstPage = Math.ceil((skip + 0.1) / itemsPerPage) || 1
  let pageCount = Math.ceil(limit / itemsPerPage)
  let pages = []

  for (let i = firstPage; pages.length < pageCount; i++) {
    pages.push(i)
  }

  return {
    pages,
    skipOnFirstPage: skip % itemsPerPage,
  }
}


class AdapterBase {
  static SUPPORTED_TYPES = []

  _normalizeItemResult(item) {
    return item
  }

  _normalizeStreamResult(stream) {
    return stream
  }

  async _findByPages(query, pages) {
    let requests = pages.map((page) => {
      return this._findByPage(query, page)
    })
    let results = await Promise.all(requests)
    return [].concat(...results)
  }

  async find(request) {
    let { SUPPORTED_TYPES, ITEMS_PER_PAGE } = this.constructor
    let { query, skip, limit } = request
    let results

    if (!SUPPORTED_TYPES.includes(query.type)) {
      throw new Error(`Content type ${query.type} is not supported`)
    }

    skip = skip || 0
    limit = (!limit || limit === Infinity) ? ITEMS_PER_PAGE : limit

    if (this._findByPages) {
      let { pages, skipOnFirstPage } = paginate(ITEMS_PER_PAGE, skip, limit)
      results = await this._findByPages(query, pages)
      results = results.slice(skipOnFirstPage, skipOnFirstPage + limit)
    } else {
      results = await this._findBySkipLimit(query, skip, limit)
    }

    return results.map((item) => this._normalizeItemResult(item))
  }

  async getItem(request) {
    let { type, id } = request.query
    let { SUPPORTED_TYPES } = this.constructor

    if (!SUPPORTED_TYPES.includes(type)) {
      throw new Error(`Content type ${type} is not supported`)
    }

    let result = await this._getItem(type, id)
    return result ? [this._normalizeItemResult(result)] : []
  }

  async getStreams(request) {
    let { type, id } = request.query
    let { SUPPORTED_TYPES } = this.constructor

    if (!SUPPORTED_TYPES.includes(type)) {
      throw new Error(`Content type ${type} is not supported`)
    }

    let results = await this._getStreams(type, id)
    return results.map((stream) => this._normalizeStreamResult(stream))
  }
}


export default AdapterBase
