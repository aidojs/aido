/**
 * Check the Slack token to authenticate request
 * @param {Object} ctx 
 * @param {Function} next 
 */
async function checkToken (ctx, next) {
  const { token } = ctx.request.body
  const { slackVerificationToken } = ctx.options
  ctx.assert(token === slackVerificationToken, 500, 'Verification token invalid')
  await next()
}

module.exports = { checkToken }
