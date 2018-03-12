import RedTube from './adapters/RedTube'


const ID = 'porn_id'
const PROP_PREFIX = 'porn.'
const ADAPTERS = [RedTube]
const SORTS = ADAPTERS.map(({ name, contentTypes }) => ({
  name,
  prop: `${PROP_PREFIX}${name}`,
  types: contentTypes,
}))


function makePornId(adapter, type, id) {
  return `${ID}:${adapter.constructor.name}-${type}-${id}`
}

function parsePornId(pornId) {
  let [adapterName, type, id] = pornId.split(':').pop().split('-')
  return { adapterName, type, id }
}

function getAdapterNameFromRequest(request) {
  if (!request.sort) {
    return
  }

  let prop = Object.keys(request.sort).find((p) => p.startsWith(PROP_PREFIX))

  if (!prop) {
    return
  }

  return prop.slice(PROP_PREFIX.length)
}


class PornClient {
  static ID = ID
  static SORTS = SORTS

  adapters = {}

  constructor() {
    ADAPTERS.forEach((Adapter) => {
      this.adapters[Adapter.name] = new Adapter()
    })
  }


  async find(request) {
    let adapterName = getAdapterNameFromRequest(request)
    let adapter = this.adapters[adapterName]

    if (!adapter) {
      throw new Error(`Adapter ${adapterName} is not found`)
    }

    let results = await adapter.find(request)
    return results.map((item) => {
      item.id = makePornId(adapter, item.type, item.id)
      return item
    })
  }

  async search() {
    return []
  }

  async getItem(request) {
    if (!request.query || !request.query.porn_id) {
      throw new Error('Unable to get an item for a request without a query')
    }

    let pornId = request.query.porn_id
    let { adapterName, type, id } = parsePornId(pornId)
    let adapter = this.adapters[adapterName]

    if (!adapter) {
      throw new Error(
        `Invalid porn id ${pornId} or non-existent adapter ${adapterName}`
      )
    }

    let result = await adapter.getItem(type, id)
    result.id = makePornId(adapter, result.type, result.id)
    return result
  }

  async getStreams(request) {
    if (!request.query || !request.query.porn_id) {
      return
    }

    let pornId = request.query.porn_id
    let { adapterName, type, id } = parsePornId(pornId)
    let adapter = this.adapters[adapterName]

    if (!adapter) {
      throw new Error(
        `Invalid porn id ${pornId} or non-existent adapter ${adapterName}`
      )
    }

    let results = await adapter.getStreams(type, id)
    return results.map((item) => {
      item[ID] = makePornId(adapter, item.type, item.id)
      return item
    })
  }
}


export default PornClient
