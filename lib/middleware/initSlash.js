const { isFunction } = require('lodash')

const logger = require('../utils/logger')

/**
 * Checks the slash exists and initializes it
 * @param {Object} ctx 
 * @param {Function} next 
 */
async function initSlash(ctx, next) {
  const { slash: command, channel } = ctx.trigger
  ctx.assert(!!ctx.slash[command], 404, `Command ${command} is not configured on this server`)
  console.log(ctx.request.body)
  const slash = new ctx.slash[command](
    ctx.trigger,
    ctx.request.body.responseUrl,
    ctx.request.body.triggerId,
    channel,
    ctx.options,
    ctx.bot,
    ctx.database,
  )
  await slash.initDb()
  await slash.init()
  ctx.slash = slash
  await next()
  try {
    if (!ctx.trigger.action) {
      // Slash command
      await slash.handleText()
    } else {
      // Action
      ctx.assert(
        slash[ctx.trigger.action] && isFunction(slash[ctx.trigger.action]),
        404, `Command ${command} is not configured on this server`
      )
      if (ctx.trigger.action) {
        await slash.preAction()
        await slash[ctx.trigger.action](ctx.trigger.args)
        await slash.postAction()
      }
    }
    await slash.persistState()
    await slash.render(ctx.views)
  } catch (e) {
    logger.error(e)
  }
}

module.exports = { initSlash }
