const Slash = require('../../../lib/slash')
const models = require('../database')

class Polls extends Slash {
  // The following methods are standard, used internally by Aido

  /**
   * Initializes the command
   */
  async init() {
    /* The default view for a Slash is the name of the command, but you can override it here */
    this.view = 'editPoll'
    /* By default, a Slash will store the user sessions in the persistent storage specified by the application
       Set to false for no persistent storage. In this case, all invocations will go through the initState() method */
    this.persistentState = true
    /* By default a Slash is private, meaning its response will only be visible to the user who invoked it.
       Set to false for a public Slash. In this case, the command will respond in the channel where it was invoked
       and be visible and interactive to all users of this channel. */
    this.private = true

    await this.createTables()
  }

  /**
   * Initializes the command state (bypassed if a persistent state is found for this command and user)
   */
  initState() {
    return {
      poll: {},
    }
  }

  // The following methods are custom, used by the different views of the slash command. Grow your own ! _\|/_
  /**
   * Creates a poll in memory
   * @param {Object} poll
   * @param {String} poll.question
   * @param {String} poll.option1
   * @param {String} poll.option2
   * @param {String} poll.option3
   * @param {String} poll.option4
   */
  createPoll({ question, option1, option2, option3, option4 }) {
    this.state.poll = {
      question,
      options: [option1, option2, option3, option4].filter(option => !!option).map(option => ({ text: option })),
    }
    this.view = 'viewPoll'
  }

  /**
   * This function just sets a flag
   * Notice that it is not stored in the state, so it will not be persisted
   */
  dummy() {
    this.hint = true
  }

  /**
   * Saves a poll in memory and publishes it
   */
  async savePoll() {
    // Persists the poll in database
    const poll = await this.database.Poll.query().upsertGraph({
      user: this.user.slackId,
      ...this.state.poll,
    })
    // Sets the slash to non-private so the poll is visible by all users of the channel
    this.private = false
    this.view = 'poll'
    this.state.poll = poll
  }

  /**
   * Vote for an option on a given poll
   * @param {Object} args
   * @param {Number} args.optionId
   * @param {Number} args.pollId
   */
  async vote({ optionId, pollId }) {
    await this.database.Vote.query().upsertGraph({
      optionId,
      pollId,
      user: this.user.slackId,
    }, { insertMissing: true })
    const [poll] = await this.database.Poll.query().where({ id: pollId }).eager('[options, options.votes]')
    this.state.poll = poll
    this.view = 'poll'
  }

  /**
   * Returns true if at least one option has a vote
   */
  get hasVotes() {
    return this.state.poll.options.some(option => option.votes && option.votes.length > 0)
  }

  // Generates an image-chart URL with the current votes on the poll
  get chartUrl() {
    const votedOptions = this.state.poll.options.filter(option =>  option.votes && option.votes.length > 0)
    const values = votedOptions.map(option => option.votes && option.votes.length).join(',')
    const labels = votedOptions.map(option => option.text).join('|')
    const totalVotes = votedOptions.reduce((total, option) => total + option.votes.length, 0)
    return encodeURI(
      `https://image-charts.com/chart?cht=pd&chs=200x200&chd=t:${values}&chl=${labels}&chan&chli=${totalVotes}%20votes`
    )
  }

  // Database stuff

  async createTables() {
    const { createTable, Model } = this.database

    const { Poll, Vote } = await models.init(createTable, Model)

    this.database.Poll = Poll
    this.database.Vote = Vote
  }
}

module.exports = Polls
