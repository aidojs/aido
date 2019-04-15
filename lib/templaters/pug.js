const pug = require('pug')

/**
 * Custom templating function
 * Return the templated Slack message or use next() to send output to html2slack
 * @param {Object}   view
 * @param {Object}   state
 * @param {Function} next
 * @returns {Object}
 */
async function template(view, locals, next) {
  const templatedHtml = pug.render(view.template ,locals)
  return next(templatedHtml)
}

module.exports = template
