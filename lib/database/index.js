const { Model } = require('objection')
const Knex = require('knex')

const createTableFactory = require('./createTable')
const Session = require('./session')

/**
 * Initializes the database and creates the tables if needed
 * @param {String} persistentStorage - the path to the sqlite database
 */
async function database(persistentStorage) {
  // Start Knex client
  const knex = Knex({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: persistentStorage,
    },
  })
  // Bind to Objection
  Model.knex(knex)
  const createTable = createTableFactory(knex)

  // Create session table
  await createTable('session', (table) => {
    table.string('id')
    table.string('user')
    table.json('state')
    table.primary(['id', 'user'])
  })

  return {
    knex,
    Model,
    createTable,

    Session,
  }
}

module.exports = database
