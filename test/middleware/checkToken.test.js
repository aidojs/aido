const sinon = require('sinon')

const { checkToken } = require('../../lib/middleware/checkToken')
const { assert } = require('../stubs')

const next = sinon.stub()

describe('Middleware - checkToken', () => {
  beforeEach(() => assert.resetHistory())

  test('Bad token - assertion throws an error', async () => {
    const ctx = {
      request: { body: { token: 'REQUEST_TOKEN' } },
      options: { slackVerificationToken: 'CONFIG_TOKEN' },
      assert,
    }
    // catch the error so that it doesn't fail the test
    await checkToken(ctx, next).catch(() => null)
    expect(ctx.assert.threw()).toBe(true)
    expect(next.called).toBe(false)
  })

  test('Good token - assertion does not throw, next is called', async () => {
    const ctx = {
      request: { body: { token: 'CONFIG_TOKEN' } },
      options: { slackVerificationToken: 'CONFIG_TOKEN' },
      assert,
    }
    await checkToken(ctx, next)
    expect(ctx.assert.threw()).toBe(false)
    expect(next.called).toBe(true)
  })
})
