const { isFunction } = require('lodash')

/**
 * Checks the slash exists and initializes it
 * @param {Object} ctx 
 * @param {Function} next 
 */
async function initSlash(ctx, next) {
  const command = ctx.trigger.slash
  const text = ctx.trigger.text
  const channel = ctx.trigger.channel
  ctx.assert(!!ctx.slash[command], 404, `Command ${command} is not configured on this server`)
  const slash = new ctx.slash[command](
    command,
    text,
    ctx.request.body.responseUrl,
    ctx.request.body.triggerId,
    channel,
    ctx.options,
    ctx.bot,
  )
  await slash.initDb()
  await slash.init()
  ctx.slash = slash
  await next()
  if (isFunction(slash.preAction)) {
    await slash.preAction()
  }
  if (ctx.trigger.action) {
    await slash[ctx.trigger.action](ctx.trigger.args)
  }
  if (text && isFunction(slash.handleText)) {
    await slash.handleText()
  }
  if (isFunction(slash.postAction)) {
    await slash.postAction()
  }
  try {
    await slash.render(ctx.views)
  } catch (e) {
    console.log(e)
  }
}

module.exports = initSlash
