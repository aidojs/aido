const normalizeObject = require('../normalizeObject')

/**
 * Check the Slack token to authenticate request
 * @param {Object} ctx 
 * @param {Function} next 
 */
async function normalizeBody (ctx, next) {
  ctx.request.body = normalizeObject(ctx.request.body)
  await next()
}

module.exports = { normalizeBody }
