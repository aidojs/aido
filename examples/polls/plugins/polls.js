const models = require('../database')

/**
 * Polls plugin - handles all interactions with the polls database
 */
function pluginFactory() {
  /**
   * Augments the Slash class with additional methods
   * @param {Slash} oldSlash 
   */
  function slashFactory(oldSlash) {
    class Slash extends oldSlash {
      async persistPoll() {    
        // Persists the poll in database
        return this.database.Poll.query().upsertGraph({
          user: this.user.slackId,
          ...this.state.poll,
        })
      }
      async persistVote(pollId, optionId) {
        await this.database.Vote.query().upsertGraph({
          optionId,
          pollId,
          user: this.user.slackId,
        }, { insertMissing: true })
        const [poll] = await this.database.Poll.query().where({ id: pollId }).eager({ options: { votes: true }})
        return poll
      }
    }
    return Slash
  }
  /**
   * Add plugin specific tables to the DB
   * @param {Object}      database
   */
  async function extendDb(database) {
    const { createTable, Model } = database
    const { Poll, Vote, Options } = await models.init(createTable, Model)    
    database.Poll = Poll
    database.Vote = Vote
    database.Options = Options
  }
  return {
    name: 'polls',
    slashFactory,
    extendDb,
  }
}

module.exports = pluginFactory
