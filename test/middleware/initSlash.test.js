const sinon = require('sinon')

const { initSlash } = require('../../lib/middleware/initSlash')
const { assert } = require('../stubs')

const next = sinon.stub()

const constructorStub = sinon.stub()
const handleTextStub = sinon.stub()
const initDbStub = sinon.stub()
const initStub = sinon.stub()
const preActionStub = sinon.stub()
const actionStub = sinon.stub()
const postActionStub = sinon.stub()
const persistStateStub = sinon.stub()
const renderStub = sinon.stub()

class TestSlash {
  constructor() {
    constructorStub()
  }
  handleText() {
    handleTextStub()
  }
  initDb() {
    initDbStub()
  }
  init() {
    initStub()
  }
  preAction() {
    preActionStub()
  }
  action() {
    actionStub()
  }
  postAction() {
    postActionStub()
  }
  persistState() {
    persistStateStub()
  }
  render() {
    renderStub()
  }
}

describe('Middleware - initSlash', () => {
  beforeEach(() => {
    assert.resetHistory()
    next.resetHistory()
    constructorStub.resetHistory()
    handleTextStub.resetHistory()
    initDbStub.resetHistory()
    initStub.resetHistory()
    preActionStub.resetHistory()
    actionStub.resetHistory()
    postActionStub.resetHistory()
    persistStateStub.resetHistory()
    renderStub.resetHistory()
  })

  test('Wrong slash command - Throws an error', async () => {
    const ctx = {
      slash: {},
      trigger: { slash: 'testSlash' },
      assert,
    }
    // Catch error so that it doesn't fail the test
    await initSlash(ctx, next).catch(() => null)
    expect(ctx.assert.threw()).toBe(true)
    expect(next.called).toBe(false)
  })

  test('Valid slash command - executes the chain of functions', async () => {
    const ctx = {
      slash: { testSlash: TestSlash },
      trigger: { slash: 'testSlash', channel: 'CW0TM8' },
      assert,
      request: { body: {} },
      views: { foo: 'bar' },
    }
    await initSlash(ctx, next)
    expect(assert.threw()).toBe(false)
    expect(constructorStub.called).toBe(true)
    expect(handleTextStub.called).toBe(true)
    expect(initDbStub.called).toBe(true)
    expect(initStub.called).toBe(true)
    expect(next.called).toBe(true)
    expect(preActionStub.called).toBe(false)
    expect(actionStub.called).toBe(false)
    expect(postActionStub.called).toBe(false)
    expect(persistStateStub.called).toBe(true)
    expect(renderStub.called).toBe(true)
  })

  test('Wrong action - Throws an error', async () => {
    const ctx = {
      slash: { testSlash: TestSlash },
      trigger: { slash: 'testSlash', channel: 'CW0TM8', action: 'wrongAction' },
      assert,
      request: { body: {} },
      views: { foo: 'bar' },
    }
    await initSlash(ctx, next).catch(() => null)
    expect(ctx.assert.threw()).toBe(true)
  })

  test('Valid action - executes the chain of functions', async () => {
    const ctx = {
      slash: { testSlash: TestSlash },
      trigger: { slash: 'testSlash', channel: 'CW0TM8', action: 'action' },
      assert,
      request: { body: {} },
      views: { foo: 'bar' },
    }
    await initSlash(ctx, next)
    expect(assert.threw()).toBe(false)
    expect(constructorStub.called).toBe(true)
    expect(handleTextStub.called).toBe(true)
    expect(initDbStub.called).toBe(true)
    expect(initStub.called).toBe(true)
    expect(next.called).toBe(true)
    expect(preActionStub.called).toBe(true)
    expect(actionStub.called).toBe(true)
    expect(postActionStub.called).toBe(true)
    expect(persistStateStub.called).toBe(true)
    expect(renderStub.called).toBe(true)
  })
})
