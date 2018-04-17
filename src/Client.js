import HttpClient from './HttpClient'
import PornHub from './adapters/PornHub'
import RedTube from './adapters/RedTube'
import PornCom from './adapters/PornCom'
import EPorner from './adapters/EPorner'
import Chaturbate from './adapters/Chaturbate'


const ID = 'porn_id'
const SORT_PROP_PREFIX = 'porn.'
const MAX_ADAPTERS_PER_REQUEST = 1
const ADAPTERS = [PornHub, RedTube, PornCom, EPorner, Chaturbate]
const SORTS = ADAPTERS.map(({ name, DISPLAY_NAME, SUPPORTED_TYPES }) => ({
  name: `Porn: ${DISPLAY_NAME}`,
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
    // Search requests are troublesome because they don't have a type specified,
    // and making multiple requests to multiple adapters for different types
    // and then aggregating them is a lot of work.
    // So we only support searching for movies for now.
    query = { search: query, type: 'movie' }
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

  return { query, adapters, skip, limit }
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


class Client {
  static ID = ID
  static SORTS = SORTS

  constructor(options) {
    let httpClient = new HttpClient(options)
    this.adapters = ADAPTERS.map((Adapter) => new Adapter(httpClient))
  }

  _getAdaptersForRequest(request) {
    let { query, adapters } = request
    let { type } = query
    let matchingAdapters = this.adapters

    if (adapters.length) {
      matchingAdapters = matchingAdapters.filter((adapter) => {
        return adapters.includes(adapter.constructor.name)
      })
    }

    if (type) {
      matchingAdapters = matchingAdapters.filter((adapter) => {
        return adapter.constructor.SUPPORTED_TYPES.includes(type)
      })
    }

    return matchingAdapters.slice(0, MAX_ADAPTERS_PER_REQUEST)
  }

  async _invokeAdapterMethod(adapter, method, request, idProp) {
    let results = await adapter[method](request)
    return results.map((result) => {
      return normalizeResult(adapter, result, idProp)
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
      let adapterResults = await this._invokeAdapterMethod(
        adapter, method, request, idProp
      )
      results.push(adapterResults)
    }

    return mergeResults(results, request.limit)
  }

  async find(rawRequest) {
    return this._invokeMethod('find', rawRequest)
  }

  async search(rawRequest) {
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


export default Client
