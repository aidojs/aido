const sinon = require('sinon')
const request = require('request-promise-native')
const { set } = require('lodash')

const logger = require('../lib/logger')

const slackEndpoints = ['dialog.open', 'mpim.open', 'im.open', 'chat.postEphemeral', 'chat.postMessage']
const slackStubs = slackEndpoints.reduce((stubs, stub) => {
  set(stubs, stub, sinon.stub())
  return stubs
}, {})

slackStubs.mpim.open.callsFake(() => ({ group: { id: 'CW0TM8' } }))
slackStubs.im.open.callsFake(() => ({ channel: { id: 'CW0TM8' } }))

const requestStub = {
  post: sinon.stub(request, 'post'),
  get: sinon.stub(request, 'get'),
}

const loggerStub = {
  info: sinon.stub(logger, 'info'),
  warn: sinon.stub(logger, 'warn'),
  error: sinon.stub(logger, 'error'),
}

const assertStub = sinon.stub().callsFake((assertion, status) => {
  if (!assertion) {
    throw new Error()
  }
})

module.exports = {
  slack: slackStubs,
  request: requestStub,
  logger: loggerStub,
  assert: assertStub,
}
