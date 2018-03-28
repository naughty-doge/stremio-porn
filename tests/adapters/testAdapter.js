function testAdapter(AdapterClass, items = []) {
  describe('@integration', () => {
    let adapter

    beforeEach(() => {
      adapter = new AdapterClass()
    })

    describe('#find()', () => {
      test('when no request query is provided, returns trending items', async () => {
        let results = await adapter.find()

        expect(results).toHaveLength(AdapterClass.ITEMS_PER_PAGE)
      })

      test('when a search string is provided, returns matching items', async () => {
        // Any respected porn site has more than 3 items matching 'deep'
        let search = 'deep'
        let limit = 3
        let results = await adapter.find({ query: { search }, limit })

        expect(results).toHaveLength(limit)
      })
    })

    describe('#getItem()', () => {
      items
        .filter((item) => item.match)
        .forEach(({ id, type, match }) => {
          test(`retrieves ${type} ${id}`, async () => {
            let query = { type, id }
            let [result] = await adapter.getItem({ query })

            expect(result).toMatchObject(match)
          })
        })
    })

    describe('#getStreams()', () => {
      items
        .filter((item) => item.streams === true)
        .forEach(({ id, type }) => {
          test(`doesn't throw for ${type} ${id}`, async () => {
            let query = { type, id }
            return adapter.getStreams({ query })
          })
        })

      items
        .filter((item) => Array.isArray(item.streams))
        .forEach(({ id, type, streams }) => {
          test(`retrieves streams for ${type} ${id}`, async () => {
            let query = { type, id }
            let results = await adapter.getStreams({ query })

            expect(results).toHaveLength(streams.length)
            streams.forEach((stream) => {
              let includesStream = Boolean(results.find((result) => {
                return result.url.includes(stream)
              }))
              expect(includesStream).toBe(true)
            })
          })
        })
    })
  })
}

export default testAdapter
