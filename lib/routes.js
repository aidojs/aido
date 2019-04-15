const koaBody = require('koa-body')
const router = require('koa-router')()
const { set, isFunction } = require('lodash')
const isJson = require('is-json')

const checkToken = require('./middleware/checkToken')
const normalizeBody = require('./middleware/normalizeBody')
const initSlash = require('./middleware/initSlash')
const emptyResponse = require('./middleware/emptyResponse')

/**
 * Initializes the Koa app with the Aido middlewares
 * @param {Object} app - The Koa app
 */
function init(app) {
  // Parse request body
  app.use(koaBody())

  router.get('', '/ping', (ctx) => { ctx.body = 'pong'})

  router.post(
    'slash',
    '/slash',
    checkToken,
    normalizeBody,
    // Identify slash command
    async (ctx, next) => {
      const { command, text } = ctx.request.body
      set(ctx, 'trigger.slash', command.replace(/\//g, ''))
      set(ctx, 'trigger.text', text)
      set(ctx, 'trigger.channel', ctx.request.body.channelId)
      await next()
    },
    initSlash,
    // Get user's ID from payload
    async (ctx, next) => {
      const slackId = ctx.request.body.userId
      await next()
      // Once the request has been responded to, load the user profile & session
      await ctx.slash.setUser(slackId)
    },
    emptyResponse,
  )
  
  router.post(
    'action',
    '/action',
    // Decode the JSON payload
    async (ctx, next) => {
      ctx.request.body = JSON.parse(ctx.request.body.payload)
      await next()
    },
    checkToken,
    normalizeBody,
    async (ctx, next) => {
      set(ctx, 'trigger.channel', ctx.request.body.channel.id)
      set(ctx, 'trigger.slash', ctx.request.body.callbackId)
      set(ctx, 'trigger.text', null)
      await next()
    },
    initSlash,
    // Get user ID from payload
    async (ctx, next) => {
      const slackId = ctx.request.body.user.id
      await next()
      // Once the request has been responded to, load the user profile & session
      await ctx.slash.setUser(slackId)
    },
    // Identify the action / execute it
    async (ctx, next) => {
      if (ctx.request.body.type === 'interactive_message') {
        const [action] = ctx.request.body.actions
        const { name, value } =  action
        if (name === 'view') {
          ctx.assert(!!ctx.views[value], 404, `View ${value} is not configured on this server`)
          ctx.slash.setView(value)
        } else {
          set(ctx, 'trigger.action', name)
          set(ctx, 'trigger.args', isJson.strict(value) ? JSON.parse(value) : value)
        }
      }
      if (ctx.request.body.type === 'dialog_submission') {
        const action = ctx.request.body.state
        const args = ctx.request.body.submission
        ctx.assert(
          ctx.slash[action] && isFunction(ctx.slash[action]),
          404, `Action ${action} is not configured on the command ${ctx.slash.command}`
        )
        set(ctx, 'trigger.action', action)
        set(ctx, 'trigger.args', args)
      }
      await next()
    },
    emptyResponse,
  )
  app.use(router.routes())
}

module.exports = init
