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


class PornAdapter {
  static SUPPORTED_TYPES = []

  _convertItemToMetaElement(item) {
    return item
  }

  async find(request) {
    let { SUPPORTED_TYPES, ITEMS_PER_PAGE } = this.constructor
    let { query, skip, limit } = request
    let results

    if (typeof query === 'string') {
      query = {
        search: query,
      }
    }

    if (query.type && !SUPPORTED_TYPES.includes(query.type)) {
      throw new Error(`Content type ${query.type} is not supported`)
    }

    if (this._findByPages) {
      let { pages, skipOnFirstPage } = paginate(ITEMS_PER_PAGE, skip, limit)
      results = await this._findByPages(query, pages)
      results = results.slice(skipOnFirstPage, limit)
    } else {
      results = await this._findBySkipLimit(query, skip, limit)
    }

    return results.map((item) => this._convertItemToMetaElement(item))
  }

  async getItem(type, id) {
    let { SUPPORTED_TYPES } = this.constructor

    if (!SUPPORTED_TYPES.includes(type)) {
      throw new Error(`Content type ${type} is not supported`)
    }

    let result = await this._getItem(type, id)
    return result ? this._convertItemToMetaElement(result) : undefined
  }

  async getStreams(type, id) {
    return this._getStreams(type, id)
  }
}


export default PornAdapter
