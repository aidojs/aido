const { emptyResponse } = require('../../lib/middleware/emptyResponse')

describe('Middleware - emptyResponse', () => {
  test('Returns the context with an empty body', async () => {
    const ctx = {}
    await emptyResponse(ctx)
    expect(ctx.body).toEqual('')
  })
})
