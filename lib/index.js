const Koa = require('koa')
const Router = require('koa-router')
const path = require('path')
const Slack = require('slack')
const Promise = require('bluebird')
const { mapValues, isFunction } = require('lodash')

const pugTemplater = require('./templaters/pug')
const applyRoutes = require('./routes')
let Slash = require('./slash')
const { initSlash } = require('./middleware/initSlash')
const { checkToken } = require('./middleware/checkToken')
const logger = require('./utils/logger')
const { detectViews, unpackView } = require('./utils/detectViews')

const databaseFactory = require('./database')

const app = new Koa()
const router = new Router()
const helpers = {}

/**
 * Configure global Aido application
 * @param {Object}   options
 * @param {Object}   options.slash                  - The list of slashes configured on this server
 * @param {Object[]} options.plugins                - An array of plugins used by this server. They will be initialized in order.
 * @param {Boolean}  options.getSlackProfile        - If true, all invocations of the app will query the Slack API for the
 *                                                    user's full profile
 * @param {Function} options.template               - A custom HTML templater can be provided (see templaters/pug.js)
 * @param {String}   options.persistentStorage      - the path to the sqlite database containing the user sessions
 * @param {String}   options.viewsFolder            - the path to the folder containing the views
 * @param {String}   options.viewsTemplateExtension - the extension of the view templates
 */
function init(options = {}) {
  // Detect folder of the calling module
  const callingFolder = path.dirname(require.main.filename)
  app.context.options = {
    getSlackProfile: false,
    template: pugTemplater,
    hints: true,
    viewsFolder: path.join(callingFolder, 'views'),
    viewsTemplateExtension: 'pug',
    persistentStorage: path.join(callingFolder, 'sessions.db'),
    ...options,
  }
  app.context.slash = options.slash || {}
  app.context.views = detectViews(app.context.options.viewsFolder, app.context.options.viewsTemplateExtension)
  app.context.plugins = options.plugins || []
}

/**
 * Registers an additional Slash command
 * @param {String} name - the name of the command
 * @param {Slash}  slash - the class of the command (must be derived from the Slash class)
 */
function registerSlash(name, slash) {
  app.context.slash[name] = slash
}

/**
 * Unpacks and registers an additional view
 * @param {String} name 
 * @param {String} template 
 */
function registerView(name, template) {
  app.context.views[name] = unpackView(name, template)
}

async function applyPlugins() {
  const koa = { app, router }
  const middleware = { checkToken, initSlash }
  const utils = { registerSlash, registerView, emitSlash, emitAction, helpers, middleware }
  // Initialize all the plugins
  await Promise.mapSeries(app.context.plugins, async (pluginFactory) => {
    // Build the plugin with the utils
    const plugin = pluginFactory(koa, utils)
    // Extend the Aido DB with the plugin tables
    if (isFunction(plugin.extendDb)) {
      await plugin.extendDb(app.context.database)
    }
    // Initialize the plugin
    if (isFunction(plugin.initPlugin)) {
      await plugin.initPlugin(app.context.database)
    }
    // Register the plugin helpers
    if (isFunction(plugin.getHelpers)) {
      const pluginHelpers = await plugin.getHelpers(app.context.database)
      helpers[plugin.name] = pluginHelpers
    }
    // Extend the slashes with the plugin methods
    if (isFunction(plugin.slashFactory)) {
      // Extend all the existing slashes
      app.context.slash = mapValues(app.context.slash, slash => plugin.slashFactory(slash))
    }
  })
}

/**
 * Starts the Koa application and listens on the given port
 * @param {Number} port 
 */
async function start(port = 3000) {
  // Init the database connection
  app.context.database = await databaseFactory(app.context.options.persistentStorage)
  // Connect the Slack client
  if (app.context.options.appToken) {
    // Single tenant bot token
    app.context.bot = new Slack({ token: app.context.options.appToken })
  } else {
    const teams = await app.context.database.Oauth.query()
      .select('team', 'token')
    app.context.bot = {}
    teams.forEach(({ team, token }) => {
      app.context.bot[team] = new Slack({ token })
    })
  }
  await applyPlugins()
  applyRoutes(app, router)
  app.listen(port)
}

/**
 * Replacement of the koa ctx.assert method
 * @param {Boolean} value
 * @param {Number} status
 * @param {String} msg
 */
function assert(value, status, msg) {
  if (value) return
  throw new Error(msg)
}

/**
 * Emit a slash command
 * @param {String} user
 * @param {String} command
 * @param {String} text
 * @param {Object} args
 * @param {Object} transportOptions
 * @param {String?} transportOptions.channel
 * @param {String?} transportOptions.conversationWith
 * @param {String?} transportOptions.conversationAs
 */
async function emitSlash(user, command, text, transportOptions = {}) {
  const { slash, views, options, bot, database } = app.context
  const ctx = {
    slash,
    views,
    assert,
    options,
    bot,
    database,
    request: { body: { } },
    trigger: {
      slash: command,
      text: text,
      args: null,
      channel: transportOptions.channel,
      conversationWith: transportOptions.conversationWith,
      conversationAs: transportOptions.conversationAs,
    },
  }
  await initSlash(ctx, () => ctx.slash.setUser(user))
  logger.info(`Command ${command} emitted for user ${user}`)
}

/**
 * Emit an action on a slash command
 * @param {String} user
 * @param {String} command
 * @param {String} action
 * @param {Object} args
 * @param {Object} transportOptions
 * @param {String?} transportOptions.channel
 * @param {String?} transportOptions.conversationWith
 * @param {String?} transportOptions.conversationAs
 * @param {String?} transportOptions.sessionId
 */
async function emitAction(user, command, action, args = {}, transportOptions = {}) {
  const { slash, views, options, bot, database } = app.context
  const ctx = {
    slash,
    views,
    assert,
    options,
    bot,
    database,
    request: { body: { } },
    trigger: {
      slash: command,
      action,
      args,
      text: null,
      channel: transportOptions.channel,
      conversationWith: transportOptions.conversationWith,
      conversationAs: transportOptions.conversationAs,
      sessionId: transportOptions.sessionId,
    },
  }
  await initSlash(ctx, () => ctx.slash.setUser(user))
  logger.info(`Action ${action} on command ${command} emitted for user ${user}`)
}

module.exports = {
  Slash,

  init,
  start,

  helpers,
  registerSlash,
  registerView,
  emitSlash,
  emitAction,

  koaApp: app,
  koaRouter: router,
}
