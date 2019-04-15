const { Model } = require('objection')

class Poll extends Model {
  static get tableName() {
    return 'poll'
  }

  static get idColumn() {
    return 'id'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user', 'question'],

      properties: {
        user: { type: 'string', minLength: 9, maxLength: 9 },
        question: { type: 'string', minLength: 1, maxLength: 255 },
      },
    }
  }

  static get relationMappings() {
    const Vote = require('./vote')
    const Option = require('./option')
    return {
      options: {
        relation: Model.HasManyRelation,
        modelClass: Option,
        join: {
          from: 'option.pollId',
          to: 'poll.id',
        },
      },
      votes: {
        relation: Model.HasManyRelation,
        modelClass: Vote,
        join: {
          from: 'vote.pollId',
          to: 'poll.id',
        },
      },
    }
  }
}

module.exports = Poll
