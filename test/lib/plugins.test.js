const { Model } = require('objection')
const fs = require('fs')
const sinon = require('sinon')

const aido = require('../../lib')
const databaseFactory = require('../../lib/database')

class Example extends Model {
  static get tableName() { return 'example' }
  static get idColumn() { return 'id' }
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'integer' },
      },
    }
  }
}

describe('Plugin system', () => {
  beforeEach(async () => {
    if (fs.existsSync(`${__dirname}/sessions.db`)) {
      fs.unlinkSync(`${__dirname}/sessions.db`)
    }
    this.database = await databaseFactory(`${__dirname}/sessions.db`)
    this.database.Example = Example
  })

  test('Loads the plugin and executes the available methods', async () => {
    const plugin = () => ({
      name: 'plugin',
      async extendDb(database) {
        await database.createTable('example', (table) => { table.integer('id') })
        database.Example = Example
      },
      async initPlugin(database) {
        await database.Example.query().insert({ id: 1 })
        await database.Example.query().insert({ id: 2 })
      },
      async getHelpers() {
        return { helper: 'helper' }
      },
      slashFactory(slash) {
        slash.additionalMethod = 'additionalMethod'
        return slash
      },
    })
    aido.init({
      hints: false,
      slash: { testSlash: { } },
      plugins: [plugin],
    })
    // stub koa listener so we don't end up with a dangling promise
    aido.koaApp.listen = sinon.stub()
    await aido.start()

    // This test succeeds because the table has been created by extendDb and populated by initPlugin
    const { count } = await this.database.Example.query().count('id as count').first()
    expect(count).toBe(2)

    // Check that aido has been decorated with helpers, and the slash decorated with additional method
    expect(aido.helpers).toMatchObject({ plugin: { helper: 'helper' } })
    expect(aido.koaApp.context.slash).toMatchObject({
      testSlash: { additionalMethod: 'additionalMethod' },
    })
  })
})
