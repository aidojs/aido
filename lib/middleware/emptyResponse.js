/**
 * Gives the Slack webhook an empty response
 * @param {Object} ctx 
 * @param {Function} next 
 */
async function emptyResponse(ctx) {
  ctx.body = ''
}

module.exports = { emptyResponse }
