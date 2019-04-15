const { isFunction } = require('lodash')
const chalk = require('chalk')

/**
 * Checks items on your configuration and displays hints to solve them
 * @param {Object[]} checklist - a list of steps to check
 */
async function checkConfiguration(checklist) {
  for (const step of checklist) {
    if (step.if === undefined || step.if) {
      const isDone = isFunction(step.done)
        ? await step.done()
        : step.done

      if (!isDone) {
        const hints = isFunction(step.hints)
          ? await step.hints()
          : step.hints
        hints.forEach(hint => console.log(hint))
        if (!step.noKill) {
          process.exit(0)
        }
      } else {
        console.log(chalk`✅ {bgGreen.blue ${step.doneMessage}}`)
      }
    }
  }
}

module.exports = checkConfiguration
