module.exports = {
  up(knex) {
    return knex.schema
      .createTable('oauth', (table) => {
        table.string('team').primary()
        table.string('token')
        table.json('profile')
      })
      .table('session', (table) => {
        table.string('team').index()
      })
  },
  down(knex) {
    return knex.schema
      .dropTable('oauth')
      .table('session', (table) => {
        table.dropColumn('team')
      })
  },
}
