function testAdapter(AdapterClass, items = []) {
  describe('@integration', () => {
    describe('#find()', () => {
      test('when no request query is provided, returns trending items', async () => {
        let adapter = new AdapterClass()
        let results = await adapter.find()

        expect(results).toHaveLength(AdapterClass.ITEMS_PER_PAGE)
      })

      test('when a search string is provided, returns matching items', async () => {
        let adapter = new AdapterClass()
        // Any respected porn site has more than 3 items matching 'deep'
        let search = 'deep'
        let limit = 3
        let results = await adapter.find({ query: { search }, limit })

        expect(results).toHaveLength(limit)
      })
    })

    describe('#getItem()', () => {
      items
        .filter((item) => item.name)
        .forEach(({ id, type, name }) => {
          test(`works for ${type} ${id}`, async () => {
            let adapter = new AdapterClass()
            let query = { type, id }
            let [result] = await adapter.getItem({ query })

            expect(result.name).toBe(name)
          })
        })
    })

    describe('#getStreams()', () => {
      items
        .filter((item) => item.streams && item.streams.length)
        .forEach(({ id, type, streams }) => {
          test(`works for ${type} ${id}`, async () => {
            let adapter = new AdapterClass()
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
