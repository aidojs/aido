const { Model } = require('objection')

class Session extends Model {
  static get tableName() {
    return 'session'
  }

  static get idColumn() {
    return ['command', 'user']
  }

  static get jsonAttributes() {
    return ['state']
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['command', 'user', 'state'],

      properties: {
        command: { type: 'string', minLength: 1, maxLength: 255 },
        user: { type: 'string', minLength: 9, maxLength: 9 },
        state: { type: 'object' },
      },
    }
  }
}

module.exports = Session
