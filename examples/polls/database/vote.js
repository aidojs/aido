const { Model } = require('objection')

class Vote extends Model {
  static get tableName() {
    return 'vote'
  }

  static get idColumn() {
    return ['pollId', 'user']
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['pollId', 'user', 'optionId'],

      properties: {
        pollId: { type: 'integer' },
        optionId: { type: 'integer' },
        user: { type: 'string', minLength: 9, maxLength: 9 },
      },
    }
  }

  static get relationMappings() {
    const Poll = require('./poll')
    const Option = require('./option')
    return {
      poll: {
        relation: Model.BelongsToOneRelation,
        modelClass: Poll,
        join: {
          from: 'poll.id',
          to: 'vote.pollId',
        },
      },
      option: {
        relation: Model.BelongsToOneRelation,
        modelClass: Option,
        join: {
          from: 'option.id',
          to: 'vote.optionId',
        },
      },
    }
  }
}

module.exports = Vote
