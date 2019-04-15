/**
 * If needed, create the required tables
 * @param {Knex} knex
 */
async function createSchema(knex) {
  // Check if the table needs to be created
  const hasTable = await knex.schema.hasTable('session')
  if (!hasTable) {
    return knex.schema.createTable('session', (table) => {
      table.string('command')
      table.string('user')
      table.json('state')
      table.primary(['command', 'user'])
    }).then(() => {}) // Coerce schema creation to promise
  }
}

module.exports = createSchema
