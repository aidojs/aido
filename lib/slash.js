const { isFunction, each, set } = require('lodash')
const html2slack = require('html2slack')
const request = require('request-promise-native')

const databaseFactory = require('./database')
const normalizeObject = require('./normalizeObject')

const sessions = []

class Slash {
  /**
   * Construct the Slash
   * @param {String} command - The invoked Slash command
   * @param {String} text - The text accompanying the Slash command
   * @param {String} responseUrl - The Slack webhook where to send the response
   * @param {String} triggerId - Trigger ID used to create dialogs
   * @param {String} channel - The ID of the channel where the command was invoked
   * @param {Object} options - The general app options
   */
  constructor(command, text, responseUrl, triggerId, channel, options, bot) {
    // General app options
    this.persistentStorage = options.persistentStorage
    this.template = options.template
    this.getSlackProfile = options.getSlackProfile
    this.bot = bot
    this.database = null
    // Properties of the slash command invocation
    this.command = command
    this.text = text
    this.responseUrl = responseUrl
    this.triggerId = triggerId
    this.channel = channel
    // Command specific options
    this.private = true
    this.persistentState = true
    this.user = null
    this.view = command
    // Command internal state
    this.state = null
  }

  /**
   * Initializes the connection to the persistent storage
   */
  async initDb() {
    if (this.persistentState && this.persistentStorage && !this.database) {
      this.database = await databaseFactory(this.persistentStorage)
    }
  }

  /**
   * Gets the text accompanying the command invocation as an array of strings
   */
  get args() {
    return this.text.split(' ')
  }

  /**
   * Convenience method to get the first argument
   */
  get subCommand() {
    return this.args[0]
  }

  /**
   * Sets the user from the application's context
   * @param {Object} user 
   */
  async setUser(slackId) {
    const { profile } = this.getSlackProfile
      ? await this.bot.users.profile.get({ user: slackId })
      : { profile: null }
    this.user = {
      slackId,
      slackProfile: normalizeObject(profile),
    }
    await this.getOrCreateSession(slackId)
  }

  /**
   * Sets the view to display
   * @param {String} view 
   */
  setView(view) {
    this.view = view
  }

  /**
   * Generates a callback id for this action with these arguments
   * @param {String} action
   * @param {Object} args
   */
  $button(action, args) {
    return `action:${action}:${JSON.stringify(args)}`
  }

  /**
   * Generates a callback id for this view
   * @param {String} view 
   */
  $view(view) {
    return `view:${view}`
  }

  /**
   * Generates a callback ID for an input
   * @param {String} action 
   */
  $input(action) {
    return `input:${action}`
  }

  /**
   * Tries to find an active session for this user and this slash
   * - First in memory
   * - Then in persistent storage if the command allows it
   * If no session is found, one is created and initialized with the slash's init function
   * @param {String} user              - The user's Slack Id
   */
  async getOrCreateSession(user) {
    // First try to find a session in memory
    const inMemorySession = sessions.find(session => session.user === user && session.command === this.command)

    if (inMemorySession) {
      return this.state = inMemorySession.state
    }

    // Otherwise fetch one from the persistent storage
    if (this.persistentState && this.persistentStorage) {
      if (!this.database) {
        this.database = await databaseFactory(this.persistentStorage)
      }

      const persistentSession = await this.database.Session.query().findById([this.command, user])

      if (persistentSession) {
        // Copy the session in memory for subsequent use
        sessions.push({
          command: this.command,
          user,
          state: persistentSession.state,
        })
        return this.state = persistentSession.state
      }
    }

    // Otherwise create one with the command's init function, store it in memory and return the state
    const initialState = isFunction(this.initState)
      ? await this.initState()
      : {}
    sessions.push({
      command: this.command,
      user,
      state: initialState,
    })
    return this.state = initialState
  }

  /**
   * Persists the current state of the slash (if needed)
   * @param {String} user              - The user's Slack Id
   */
  async persistState(user) {
    if (this.persistentState) {
      const persistentSession = await this.database.Session.query().findById([this.command, user])
      if (persistentSession) {
        return persistentSession.$query().patch({ state: this.state })
      }
      return this.database.Session.query().insert({
        user,
        command: this.command,
        state: this.state,
      })
    }
  }

  /**
   * Executes the Slash command with the information present in the context
   * @param {Object} views - the application's views collection
   */
  async render(views) {
    // Replace the view name with the actual view configuration
    this.view = views[this.view]
    // Render the view using the templater
    const message = await this.template(this.view, this, html => html2slack(html))
    // Persist session state
    await this.persistState(this.user.slackId)
    if (this.view.modal) {
      // Patch command name in the callback ID
      message.callback_id = this.command
    } else {
      // Patch all attachments with a callback id so the buttons work
      each(message.attachments, attachment => set(attachment, 'callback_id', this.command))
    }
    await this.transport(message)
  }

  /**
   * Transports the view to the user
   * @param {Object} message 
   */
  async transport(message) {
    try {
      if (this.view.modal) {
        return this.bot.dialog.open({ dialog: message, trigger_id: this.triggerId })
      }
      if (!this.private && this.channel) {
        return this.bot.chat.postMessage({
          channel: this.channel,
          attachments: message.attachments,
          text: '',
        })
      }
      return request({
        method: 'POST',
        uri: this.responseUrl,
        body: message,
        json: true,
      })
    } catch (e) {
      console.log('Unable to post to Slack')
      console.log(e)
    }
  }

}

module.exports = Slash
