const path = require('path')
const sinon = require('sinon')

const initSlashModule = require('../../lib/middleware/initSlash')
const initSlashStub = sinon.stub(initSlashModule, 'initSlash')
const aido = require('../../lib')
require('../stubs')


describe('Aido library - Initialization', () => {
  describe('Views', () => {
    test('Default views folder - detects and registers views', () => {
      aido.init()
      expect(aido.koaApp.context.views).toMatchObject({
        testModal: {
          name: 'testModal',
          modal: true,
        },
        testView: {
          name: 'testView',
          modal: false,
        },
      })
    })

    test('Custom views folder - detects and registers views', () => {
      aido.init({ viewsFolder: path.join(__dirname, 'customViews') })
      expect(aido.koaApp.context.views).toMatchObject({
        customModal: {
          name: 'customModal',
          modal: true,
        },
        customView: {
          name: 'customView',
          modal: false,
        },
      })
    })
  })

  describe('Helpers', () => {
    beforeEach(() => {
      initSlashStub.resetHistory()
    })

    test('Register additional slash and view', () => {
      aido.init()
      aido.registerSlash('testSlash', {})
      aido.registerView('additionalModal', 'body(class="modal")')
      aido.registerView('additionalView', 'body')
      expect(aido.koaApp.context.views).toMatchObject({
        additionalModal: {
          name: 'additionalModal',
          modal: true,
        },
        additionalView: {
          name: 'additionalView',
          modal: false,
        },
      })
      expect(aido.koaApp.context.slash).toMatchObject({
        testSlash: {},
      })
    })

    test('Manually emit slash', async () => {
      const slash = { testSlash: {} }
      aido.init({ slash })
      await aido.emitSlash('UW0TM8', 'testSlash', 'some text', {
        channel: 'CW0TM8',
        conversationWith: ['UW0TM7'],
        conversationAs: 'bot',
      })
      const [ctx] = initSlashStub.firstCall.args
      expect(ctx.slash).toMatchObject(slash)
      expect(ctx.trigger).toMatchObject({
        slash: 'testSlash',
        text: 'some text',
        args: null,
        channel: 'CW0TM8',
        conversationWith: ['UW0TM7'],
        conversationAs: 'bot',
      })
    })

    test('Manually emit action', async () => {
      const slash = { testSlash: { someAction: () => null } }
      aido.init({ slash })
      await aido.emitAction('UW0TM8', 'testSlash', 'someAction', { foo: 'bar' }, {
        channel: 'CW0TM8',
        conversationWith: ['UW0TM7'],
        conversationAs: 'bot',
        sessionId: 'SW0TM8',
      })
      const [ctx] = initSlashStub.firstCall.args
      expect(ctx.slash).toMatchObject(slash)
      expect(ctx.trigger).toMatchObject({
        slash: 'testSlash',
        text: null,
        args: { foo: 'bar' },
        channel: 'CW0TM8',
        conversationWith: ['UW0TM7'],
        conversationAs: 'bot',
        sessionId: 'SW0TM8',
      })
    })
  })
})
