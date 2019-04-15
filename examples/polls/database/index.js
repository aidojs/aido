const Poll = require('./poll')
const Vote = require('./vote')
const Option = require('./option')

/**
 * Initializes the required models
 * @param {Function} createTable 
 * @param {Model} Model 
 */
async function init(createTable) {
  await createTable('poll', (table) => {
    table.increments('id').primary()
    table.string('user')
    table.string('question')
  })
  await createTable('option', (table) => {
    table.increments('id').primary()
    table.integer('pollId')
    table.string('text')
  })
  await createTable('vote', (table) => {
    table.integer('pollId')
    table.string('user')
    table.integer('optionId')
    table.primary(['pollId', 'user'])
  })

  return { Poll, Vote, Option }
}

module.exports = { init }
