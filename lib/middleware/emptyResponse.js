/**
 * Gives the Slack webhook an empty response
 * @param {Object} ctx 
 * @param {Function} next 
 */
async function initSlash(ctx) {
  ctx.body = ''
}

module.exports = initSlash
