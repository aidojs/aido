const { Model } = require('objection')
const Knex = require('knex')
const { isPlainObject } = require('lodash')

const createTableFactory = require('./createTable')
const Session = require('./session')
const Oauth = require('./oauth')

/**
 * Initializes the database and creates the tables if needed
 * @param {String|Object} persistentStorage - the path to the sqlite database or a Knex compatible connection object
 */
async function database(persistentStorage) {
  // If persistentStorage is an object, it should be a Knex compatible connection object
  // If it is a string it is considered to be the absolute path to the SQLite database
  const clientOptions = isPlainObject(persistentStorage)
    ? persistentStorage
    : {
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: {
        filename: persistentStorage,
      },
    }

  // Start Knex client
  const knex = Knex(clientOptions)
  // Bind to Objection
  Model.knex(knex)
  const createTable = createTableFactory(knex)

  // Create session table
  await createTable('session', (table) => {
    table.string('id').primary()
    table.string('user').index()
    table.json('state')
  })

  // Apply any needed migrations
  await knex.migrate.latest({ directory: `${__dirname}/migrations` })

  return {
    knex,
    Model,
    createTable,

    Oauth,
    Session,
  }
}

module.exports = database
