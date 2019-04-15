const { Model } = require('objection')

class Option extends Model {
  static get tableName() {
    return 'option'
  }

  static get idColumn() {
    return 'id'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['pollId', 'text'],

      properties: {
        pollId: { type: 'integer' },
        text: { type: 'string' },
      },
    }
  }

  static get relationMappings() {
    const Poll = require('./poll')
    const Vote = require('./vote')
    return {
      poll: {
        relation: Model.BelongsToOneRelation,
        modelClass: Poll,
        join: {
          from: 'poll.id',
          to: 'option.pollId',
        },
      },
      votes: {
        relation: Model.HasManyRelation,
        modelClass: Vote,
        join: {
          from: 'vote.optionId',
          to: 'option.id',
        },
      },
    }
  }
}

module.exports = Option
