const Koa = require('koa')
const Router = require('koa-router')
const path = require('path')
const Slack = require('slack')
const Promise = require('bluebird')
const { mapValues, isFunction } = require('lodash')

const pugTemplater = require('./templaters/pug')
const applyRoutes = require('./routes')
const configurator = require('./configurator')
const lt = require('./configurator/localtunnel')
let Slash = require('./slash')
const { initSlash } = require('./middleware/initSlash')
const logger = require('./logger')
const { detectViews, unpackView } = require('./detectViews')

const databaseFactory = require('./database')

const app = new Koa()
const router = new Router()
const helpers = {}

/**
 * Configure global Aido application
 * @param {Object} options
 * @param {Boolean} options.getSlackProfile - If true, all invocations of the app will query the Slack API for the
 *                                            user's full profile
 * @param {Function} options.template - A custom HTML templater can be provided (see templaters/pug.js)
 * @param {Boolean} options.hints - prints configuration hints on the server console
 * @param {String} options.persistentStorage - the path to the sqlite database containing the user sessions
 * @param {String} options.viewsFolder - the path to the folder containing the views
 * @param {String} options.viewsTemplateExtension - the extension of the view templates
 * @param {String} options.appId - the Slack application's ID (used to display configuration hints)
 * @param {Object} options.tunnel - the local tunnel configuration
 * @param {String} options.tunnel.custom - if you already have a tunnel setup, enter its url here (ex: https://xxx.ngrok.io)
 * @param {Object} options.tunnel.lt - if you need a tunnel, aido can open it with localtunnel.me
 * @param {String} options.tunnel.lt.port - the local port to proxy to
 * @param {String} options.tunnel.lt.subDomain - to request a specific subdomain on localtunnel.me (see https://www.npmjs.com/package/localtunnel#opts)
 * @param {String} options.tunnel.lt.localHost - proxy requests to this hostname instead of localhost (see https://www.npmjs.com/package/localtunnel#opts)
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
    tunnel: {},
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

async function applyConfigurations() {
  const koa = { app, router }
  const utils = { registerSlash, registerView, emitSlash, emitAction, helpers }
  // Init the database connection
  app.context.database = await databaseFactory(app.context.options.persistentStorage)
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
 * Returns the URL of the tunnel (if necessary, starts one with localtunnel)
 * @param {Number} port
 * @param {Object} options
 * @returns {String}
 */
async function getTunnel(port, options = {}) {
  if (options.custom) {
    return options.custom
  }
  if (options.lt) {
    const { subDomain, localHost } = options.lt
    const tunnel = await lt(port, subDomain, localHost)
    return tunnel.url
  }
  return 'https://your.site.here'
}
/**
 * Starts the Koa application and listens on the given port
 * @param {Number} port 
 */
async function start(port = 3000) {
  // Check if we are in dev mode
  const dev = process.argv[2] === 'dev'
  // Connect the Slack client
  if (app.context.options.appToken) {
    app.context.bot = new Slack({ token: app.context.options.appToken })
  }
  // Dev mode, connect the tunnel
  if (dev) {
    app.context.options.tunnel.url = await getTunnel(port, app.context.options.tunnel)
  }
  // Call the configurator
  if (app.context.options.hints) {
    await configurator(app, dev)
  }
  await applyConfigurations()
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
