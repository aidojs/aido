const Slash = require('../../lib/slash')
const stubs = require('../stubs')

describe('Slash class - transport method', () => {
  beforeEach(() => {
    this.slash = new Slash()
    this.slash.view = { modal: false }
    this.slash.bot = stubs.slack
    this.slash.options = {}
    this.slash.user = { slackId: 'UW0TM8' }
  })

  describe('Modal dialogs', () => {
    test('no trigger id - should not send', async () => {
      this.slash.view.modal = true
      try {
        await this.slash.transport('testMessage')
      } catch (e) {
        expect(e.message).toBe("Can't open a dialog without a user trigger")
      }
      expect(stubs.slack.dialog.open.called).toBe(false)
    })

    test('trigger id provided - open dialog with trigger id', async () => {
      this.slash.view.modal = true
      this.slash.triggerId = 'foo'
      await this.slash.transport('testMessage')
      expect(stubs.slack.dialog.open.calledWithMatch({
        dialog: 'testMessage',
        trigger_id: this.slash.triggerId,
      })).toBe(true)
    })
  })

  describe('One user conversations', () => {
    test('Response URL provided - send directly to it', async () => {
      this.slash.private = true
      this.slash.responseUrl = 'https://dummy.url.io'
      await this.slash.transport('testMessage')
      expect(stubs.request.post.calledWithMatch({
        uri: this.slash.responseUrl,
        body: 'testMessage',
        json: true,
      })).toBe(true)
    })

    test('No response URL provided - open an IM and send to it', async () => {
      const attachments = []
      await this.slash.transport({ attachments })
      expect(stubs.slack.im.open.calledWithMatch({
        user: this.slash.user.slackId,
      })).toBe(true)
      expect(stubs.slack.chat.postMessage.calledWithMatch({
        attachments,
        text: '',
      })).toBe(true)
    })
  })

  describe('Multi user conversations as bot', () => {
    beforeEach(() => {
      this.slash.private = false
      this.slash.conversationAs = 'bot'
      this.slash.isMultiConversation = true
      this.slash.conversationWith = ['UW0TM9']
    })

    test('No bot token - should not send', async () => {
      try {
        await this.slash.transport('testMessage')
      } catch (e) {
        expect(e.message).toBe("Can't open a conversation as bot without a bot token")
      }
    })

    test('Public message - open a group conversation and send using the bot token', async () => {
      this.slash.options.botToken = 'bar'
      const attachments = []
      await this.slash.transport({ attachments })
      expect(stubs.slack.mpim.open.calledWithMatch({
        users: [
          this.slash.user.slackId,
          ...this.slash.conversationWith,
        ].join(','),
        token: this.slash.options.botToken,
      })).toBe(true)
      expect(stubs.slack.chat.postMessage.calledWithMatch({
        channel: 'CW0TM8',
        attachments,
        text: '',
        token: this.slash.options.botToken,
      })).toBe(true)
    })

    test('Private message - send ephemeral using the bot token', async () => {
      this.slash.private = true
      this.slash.options.botToken = 'bar'
      const attachments = []
      await this.slash.transport({ attachments })
      expect(stubs.slack.chat.postEphemeral.calledWithMatch({
        channel: 'CW0TM8',
        attachments,
        text: '',
        token: this.slash.options.botToken,
        user: this.slash.user.slackId,
      })).toBe(true)
    })
  })
})
