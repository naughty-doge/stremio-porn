import PornHub from '../../src/adapters/PornHub'


describe('Stream extraction graceful failure', () => {
  test('PornHub returns empty array when embed page has no matching URLs', () => {
    let adapter = new PornHub()
    let result = adapter._extractStreamsFromEmbed('<html>no video here</html>')

    expect(result).toEqual([])
  })
})
