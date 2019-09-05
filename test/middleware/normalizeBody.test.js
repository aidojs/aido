const { normalizeBody } = require('../../lib/middleware/normalizeBody')

const originalObject = {
  some_property: 'test',
  other_property: 'test',
}

const normalizedObject = {
  someProperty: 'test',
  otherProperty: 'test',
}

describe('Middleware - Normalise body', () => {
  test('Camelcases the properties of a payload', () => {
    const ctx = {
      request: { body: originalObject },
    }
    normalizeBody(ctx, () => null)
    expect(ctx.request.body).toEqual(normalizedObject)
  })
})
