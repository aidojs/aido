const sinon = require('sinon')

const Slash = require('../../lib/slash')

describe('Slash class - render method', () => {
  beforeEach(() => {
    this.slash = new Slash()
    this.slash.view = 'test'
    this.slash.transport = sinon.stub()
    this.slash.template = sinon.stub().callsFake(() => ({ attachments: [{}, {}, {}]}))
    this.slash.command = 'foo'
  })

  test("Normal view - attach session Id to each attachment's callback", async () => {
    await this.slash.render({ test: { modal: false } })
    const renderedMessage = this.slash.transport.lastCall.lastArg
    renderedMessage.attachments.forEach(attachment => expect(attachment.callback_id).toBe(this.slash.command))
  })

  test("Modal view - attach session Id to the message's callback", async () => {
    await this.slash.render({ test: { modal: true } })
    const renderedMessage = this.slash.transport.lastCall.lastArg
    expect(renderedMessage.callback_id).toBe(this.slash.command)
  })
})
