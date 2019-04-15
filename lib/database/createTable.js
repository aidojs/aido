/**
 * Binds the knex instance to the create table method
 * @param {Object} knex 
 */
function createTableFactory(knex) {
  /**
   * 
   * @param {String}   tableName - the table name
   * @param {Function} callback  - a callback to create the model in Objection
   */
  async function createTable(tableName, callback) {
    // Check if the table needs to be created
    const table = await knex.schema.hasTable(tableName)
    if (!table) {
      return knex.schema.createTable(tableName, callback).then(() => {}) // Coerce schema creation to promise
    }
  }

  return createTable
}

module.exports = createTableFactory
