import RedTube from './adapters/RedTube'


const ID = 'porn_id'
const SORT_PROP_PREFIX = 'porn.'
const ADAPTERS = [RedTube]
const SORTS = ADAPTERS.map(({ name, SUPPORTED_TYPES }) => ({
  name,
  prop: `${SORT_PROP_PREFIX}${name}`,
  types: SUPPORTED_TYPES,
}))


function makePornId(adapter, type, id) {
  return `${ID}:${adapter}-${type}-${id}`
}

function parsePornId(pornId) {
  let [adapter, type, id] = pornId.split(':').pop().split('-')
  return { adapter, type, id }
}

function normalizeRequest(request) {
  let { query, sort, limit, skip } = request
  let adapters = []

  if (sort) {
    adapters = Object.keys(sort)
      .filter((p) => p.startsWith(SORT_PROP_PREFIX))
      .map((p) => p.slice(SORT_PROP_PREFIX.length))
  }

  if (typeof query === 'string') {
    query = { search: query }
  } else if (query) {
    query = { ...query }
  } else {
    query = {}
  }

  if (query.porn_id) {
    let { adapter, type, id } = parsePornId(query.porn_id)

    if (type && query.type && type !== query.type) {
      throw new Error(
        `Request query and porn_id types do not match (${type}, ${query.type})`
      )
    }

    if (adapters.length && !adapters.includes(adapter)) {
      throw new Error(
        `Request sort and porn_id adapters do not match (${adapter})`
      )
    }

    adapters = [adapter]
    query.type = type
    query.id = id
  }

  return {
    query, adapters,
    limit: limit || Infinity,
    skip: skip || 0,
  }
}

function normalizeResult(adapter, item, idProp = 'id') {
  let newItem = { ...item }
  newItem[idProp] = makePornId(adapter.constructor.name, item.type, item.id)
  return newItem
}

function mergeResults(results) {
  // TODO: limit
  return results.reduce((results, adapterResults) => {
    results.push(...adapterResults)
    return results
  }, [])
}


class PornClient {
  static ID = ID
  static SORTS = SORTS

  adapters = ADAPTERS.map((Adapter) => new Adapter())

  _getAdaptersForRequest(request) {
    let { query, adapters } = request
    let type = query && query.type

    if (!adapters.length) {
      return this.adapters
    }

    return this.adapters.filter((adapter) => {
      let adapterClass = adapter.constructor
      return (
        adapters.includes(adapterClass.name) &&
        (!type || adapterClass.SUPPORTED_TYPES.includes(type))
      )
    })
  }

  async _invokeMethod(method, rawRequest, idProp) {
    let request = normalizeRequest(rawRequest)
    let adapters = this._getAdaptersForRequest(request)

    if (!adapters.length) {
      throw new Error('Couldn\'t find suitable adapters for a request')
    }

    let results = []

    for (let adapter of adapters) {
      let adapterResults = await adapter[method](request)
      adapterResults = adapterResults.map((result) => {
        return normalizeResult(adapter, result, idProp)
      })
      results.push(adapterResults)
    }

    return mergeResults(results, request.limit)
  }

  async find(rawRequest) {
    return this._invokeMethod('find', rawRequest)
  }

  async getItem(rawRequest) {
    let [result] = await this._invokeMethod('getItem', rawRequest)
    return result
  }

  async getStreams(rawRequest) {
    return this._invokeMethod('getStreams', rawRequest, ID)
  }

  async getGenres() {
    return []
  }
}


export default PornClient
