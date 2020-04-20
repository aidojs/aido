const { Model } = require('objection')

class Oauth extends Model {
  static get tableName() {
    return 'oauth'
  }

  static get idColumn() {
    return ['team']
  }

  static get jsonAttributes() {
    return ['profile']
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['team', 'token', 'profile'],

      properties: {
        team: { type: 'string', minLength: 8, maxLength: 12 },
        token: { type: 'string', minLength: 56, maxLength: 56 },
        profile: { type: 'object' },
      },
    }
  }
}

module.exports = Oauth
