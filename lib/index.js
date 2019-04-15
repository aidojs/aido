const Koa = require('koa')
const path = require('path')
const fs = require('fs')
const Slack = require('slack')

const pugTemplater = require('./templaters/pug')
const init = require('./routes')
const configurator = require('./configurator')
const lt = require('./configurator/localtunnel')
const Slash = require('./slash')

const app = new Koa()

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
 */
function configure(options) {
  app.context.options = {
    getSlackProfile: true,
    template: pugTemplater,
    hints: true,
    viewsFolder: path.join(__dirname, 'views'),
    viewsTemplateExtension: 'pug',
    noCommandIntrospection: false,
    ...options,
  }
  app.context.slash = {}
  app.context.views = {}
}

/**
 * Registers a Slash command
 * @param {String} name - the name of the command
 * @param {Slash}  slash - the class of the command (must be derived from the Slash class)
 */
function registerSlash(name, slash) {
  app.context.slash[name] = slash
}

/**
 * Registers a view for use in the app. Views are found in options.viewsFolder, and can consist of :
 * - a pug file with the template
 * - a js file exposing view options
 * @param {String}  name  - The name of the view
 * @param {Boolean} modal - Indicates whether the view should display as a modal dialog
 */
function registerView(name, modal = false) {
  const { viewsFolder, viewsTemplateExtension } = app.context.options
  // Try to require the options & template file
  try {
    const template = fs.readFileSync(path.join(viewsFolder, `${name}.${viewsTemplateExtension}`), { encoding: 'utf-8' })
    app.context.views[name] = {
      name,
      modal,
      template,
    }
  } catch(e) {
    if (e.code === 'ENOENT') {
      console.log(`Couldn't find template for view ${name}... Exiting.`)
      process.exit(-1)
    }
  }
}

/**
 * Starts the Koa application and listens on the given port
 * @param {Number} port 
 */
async function listen(port) {
  // Check if we are in dev mode
  const dev = process.argv[2] === 'dev'
  // Connect the Slack client
  if (app.context.options.botToken) {
    app.context.bot = new Slack({ token: app.context.options.botToken })
  }
  // Connect the local tunnel if necessary
  if (dev) {
    if (app.context.options.localtunnel) {
      const { subDomain, localHost, custom } = app.context.options.localtunnel
      app.context.tunnel = custom
        ? { url: custom }
        : await lt(port, subDomain, localHost)
    }
  }
  // Call the configurator
  if (app.context.options.hints) {
    await configurator(app, dev)
  }
  init(app)
  app.listen(port)
}

module.exports = {
  configure,
  registerSlash,
  registerView,
  listen,
  Slash,
}
