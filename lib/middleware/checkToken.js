const crypto = require('crypto')

/**
 * Validate that the request is coming from Slack
 * @param {Object} ctx 
 * @param {Function} next 
 */
async function checkToken (ctx, next) {
  // Using the old school verification token
  if (ctx.options.slackVerificationToken) {
    const { token } = ctx.request.body
    ctx.assert(token === ctx.options.slackVerificationToken, 500, 'Verification token invalid')
  }
  // Using the new signing secrets
  if (ctx.options.signingSecret) {
    const unparsedBody = ctx.request.body[Symbol.for('unparsedBody')]
    const {
      'x-slack-request-timestamp': timestamp,
      'x-slack-signature': signature,
    } = ctx.request.headers

    const signatureString = `v0:${timestamp}:${unparsedBody}`
    const hmac = crypto.createHmac('sha256', ctx.options.signingSecret)
    hmac.update(signatureString)
    const verificationSignature = `v0=${hmac.digest('hex')}`
    ctx.assert(verificationSignature === signature, 500, 'Signature invalid')
  }
  
  await next()
}

module.exports = { checkToken }
