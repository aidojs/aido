const { isArray, each, set, forIn, isObject } = require('lodash')
const html2slack = require('html2slack')
const request = require('request-promise-native')

const normalizeObject = require('./utils/normalizeObject')

const sessions = []

class Slash {
  /**
   * Construct the Slash
   * @param {Object} trigger - The invocation context
   * @param {String} trigger.slash - The invoked Slash command
   * @param {String} trigger.text - The text accompanying the Slash command
   * @param {String} trigger.conversationWith - An array of users with whom the conversation should take place
   * @param {String} trigger.conversationAs - the kind of token to use ('bot' or 'user')
   * @param {String} trigger.sessionId - The session ID from the callback_id of the Slack payload
   * @param {String} responseUrl - The Slack webhook where to send the response
   * @param {String} triggerId - Trigger ID used to create dialogs
   * @param {String} channel - The ID of the channel where the command was invoked
   * @param {Object} options - The general app options
   * @param {Object} bot - The Slack API client
   * @param {Object} database - The opened database
   */
  constructor(trigger = {}, responseUrl, triggerId, channel, options = {}, bot, database) {
    const { slash: command, text, conversationWith, conversationAs } = trigger
    // General app options
    this.options = options
    this.template = options.template
    this.getSlackProfile = options.getSlackProfile
    this._bot = bot
    this.database = database
    // Properties of the slash command invocation
    this.command = command
    this.text = text
    this.responseUrl = responseUrl
    this.triggerId = triggerId
    this.channel = channel
    this.conversationWith = conversationWith
    this.conversationAs = conversationAs
    this.trigger = trigger
    // Command specific options
    this.private = true
    this.callable = true
    this.multiUsers = false
    this.persistentState = true
    this.user = null
    this.view = command
    this.noView = false
    // Command internal state
    this._state = {}
  }

  /**
   * Assigns a value to the state without losing the reference
   * @param {Object} newState
   */
  set state(newState) {
    if (!isObject(newState)) {
      throw new Error('State can only contain objects')
    }
    forIn(this._state, (v, key) => { delete this._state[key] })
    forIn(newState, (value, key) => { this._state[key] = value })
  }

  /**
   * Getter for _state
   */
  get state() {
    return this._state
  }

  /**
   * Helper that determines if this is a multi-tenant installation
   */
  get isMultitenant() {
    return this.trigger.team && !!this._bot[this.trigger.team]
  }

  /**
   * Getter for _bot. Returns a Slack instance initialized with the correct token
   */
  get bot() {
    if (this.isMultitenant) {
      return this._bot[this.trigger.team]
    }
    return this._bot
  }

  /**
   * Checks that we have the relevant tokens to send a multi-conversation
   */
  get canSendMultiConversation() {
    if (!this.conversationAs === 'bot') {
      return true
    }
    if (this.isMultitenant) {
      return true
    }
    if (this.options.appToken.startsWith('xoxb')) {
      return true
    }
    if (this.options.botToken) {
      return true
    }
    return false
  }

  /**
   * Bogus init function. Should be overridden by a custom one.
   */
  async init() {
    return true
  }

  /**
   * This function can be used to extend the database in a plugin or slash
   */
  async initDb() {
    return true
  }

  /**
   * Bogus initState function. Can be overridden by a custom one
   */
  async initState() {
    return {}
  }

  /**
   * Bogus converseWith function. Can be overridden by a custom one
   */
  async converseWith() {
    return true
  }

  /**
   * Bogus preAction function. Can be overridden by a custom one
   */
  async preAction() {
    return true
  }

  /**
   * Bogus handleText function. Can be overridden by a custom one
   */
  async handleText() {
    return true
  }

  /**
   * Bogus postAction function. Can be overridden by a custom one
   */
  async postAction() {
    return true
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
    if (this.args.length === 0) {
      return ''
    }
    return this.args[0]
  }

  /**
   * Returns true if this conversation is transported to a multi part IM
   * @returns {Boolean}
   */
  get isMultiConversation() {
    return isArray(this.conversationWith) && this.conversationWith.length > 0
  }

  /**
   * Returns true if the user making an action is the originator of the command
   * @returns {Boolean}
   */
  get isOriginator() {
    if (!this.isMultiConversation) {
      return true
    }
    return this.user.slackId === this.trigger.originator
  }

  /**
   * The session ID is the command name, optionnally suffixed with the conversation users, in the following format :
   * - command
   * - command-UXXXXXX-UXXXXXX
   * @returns {String}
   */
  get sessionId() {
    if (!this.isMultiConversation) {
      return this.command
    }
    if (this.trigger.sessionId) {
      return this.trigger.sessionId
    }
    return [
      this.command,
      this.user.slackId,
      ...this.conversationWith,
    ].join('-')
  }

  /**
   * Forgets the response URL so Aido has to create a new view and request a new transport
   */
  requestNewView() {
    this.responseUrl = null
  }

  /**
   * Sets the user from the application's context
   * @param {Object} user 
   */
  async setUser(slackId) {
    this.user = { slackId }

    if (this.getSlackProfile) {
      const { user } = await this.bot.users.info({ user: slackId })
      this.user.slackProfile = normalizeObject(user)
    }
    await this.getOrCreateSession()
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
   * Gets the session from memory cache. Sessions are indexed :
   * - by command and user (single conversation)
   * - by session ID (multi conversation)
   * @returns {Object}
   */
  get inMemorySession() {
    if (this.isMultiConversation) {
      return sessions.find(session => session.id === this.sessionId)
    }
    return sessions.find(session => (
      (session.user === this.user.slackId && session.id === this.sessionId)
      && (session.team === null || session.team === this.trigger.team)
    ))
  }

  /**
   * Gets the session from database. Sessions are indexed :
   * - by command and user (single conversation)
   * - by session ID (multi conversation)
   */
  async getPersistedSession() {
    if (this.isMultiConversation) {
      return this.database.Session.query().findOne('id', this.sessionId)
    }
    const { team } = this.trigger
    const { slackId } = this.user
    if (!team) {
      // Get older sessions which don't have a team
      return this.database.Session.query()
        .first()
        .whereNull('team').where('user', slackId)
    }
    // Get newer session with a team
    return this.database.Session.query()
      .first()
      .where('team', team).where('user', slackId)
  }

  /**
   * Tries to find an active session for this user and this slash
   * - First in memory
   * - Then in persistent storage if the command allows it
   * If no session is found, one is created and initialized with the slash's init function
   */
  async getOrCreateSession() {
    // First try to find a session in memory
    const { inMemorySession } = this
    if (inMemorySession) {
      return this._state = inMemorySession.state
    }

    // Otherwise fetch one from the persistent storage
    if (this.persistentState) {
      const persistentSession = await this.getPersistedSession()
      if (persistentSession) {
        // Copy the session in memory for subsequent use
        sessions.push({
          id: this.sessionId,
          team: this.trigger.team,
          user: this.user.slackId,
          state: persistentSession.state,
        })
        return this._state = persistentSession.state
      }
    }

    // Otherwise create one with the command's init function, store it in memory and return the state
    // The session will be persisted in persistState
    const initialState = await this.initState()
    this._state = initialState
    return sessions.push({
      id: this.sessionId,
      user: this.user.slackId,
      state: this._state,
    })
  }

  /**
   * Persists the current state of the slash (if needed)
   */
  async persistState() {
    if (this.persistentState) {
      const persistentSession = await this.getPersistedSession()
      if (persistentSession) {
        return persistentSession.$query().patch({ team: this.trigger.team, state: this._state })
      }
      return this.database.Session.query().insert({
        id: this.sessionId,
        team: this.trigger.team,
        user: this.user.slackId,
        state: this._state,
      })
    }
  }

  /**
   * Executes the Slash command with the information present in the context
   * @param {Object} views - the application's views collection
   */
  async render(views) {
    if (!this.noView) {
      // Replace the view name with the actual view configuration
      this.view = views[this.view]
      // Render the view using the templater
      const message = await this.template(this.view, this, html => html2slack(html))
      if (this.view.modal) {
        // Patch command name in the callback ID
        message.callback_id = this.sessionId
      } else {
        // Patch all attachments with a callback id so the buttons work
        each(message.attachments, attachment => set(attachment, 'callback_id', this.sessionId))
      }
      await this.transport(message)
    }
  }

  /**
   * Transports the view to the user
   * @param {Object} message
   */
  async transport(message) {
    if (this.view.modal) {
      if (!this.triggerId) {
        throw new Error("Can't open a dialog without a user trigger")
      }
      return this.bot.dialog.open({ dialog: message, trigger_id: this.triggerId })
    }
    if (this.private && this.responseUrl) {
      return request.post({
        uri: this.responseUrl,
        body: message,
        json: true,
      })
    }
    // If this is a multipart conversation that doesn't have a channel yet, open the conversation
    if (this.isMultiConversation) {
      if (!this.canSendMultiConversation) {
        throw new Error("Can't open a conversation as bot without a bot token")
      }
      if (!this.channel) {
        const { group } = await this.bot.mpim.open({
          users: [
            this.user.slackId,
            ...this.conversationWith,
          ].join(','),
          ...this.conversationAs === 'bot' && { token: this.options.botToken },
        })
        this.channel = group.id
      }
    }
    // If no channel is readily available, open a DM with the user
    if (!this.channel) {
      const { channel } = await this.bot.im.open({
        user: this.user.slackId,
      })
      this.channel = channel.id
    }
    const payload = {
      channel: this.channel,
      attachments: message.attachments,
      text: '',
      ...this.conversationAs === 'bot' && { token: this.options.botToken },
    }
    // A private message in a multi-party conversation should be sent as an ephemeral
    if (this.isMultiConversation && this.private) {
      return this.bot.chat.postEphemeral({
        ...payload,
        user: this.user.slackId,
      })
    }
    return this.bot.chat.postMessage(payload)
  }
}

module.exports = Slash
