const request = require('request-promise-native')

const logger = require('../logger')

/**
 * This is an alternative slack client, allowing you to hit undocumented endpoints
 * or get full responses including headers
 * @param {String}  endpoint 
 * @param {Object}  args 
 * @param {Boolean} fullResponse 
 * @param {String}  token 
 */
async function customApi(endpoint, args = {}, fullResponse = false, token) {
  const res = await request({
    method: 'POST',
    uri: `https://slack.com/api/${endpoint}`,
    form: {
      token,
      ...args,
    },
    json: true,
    resolveWithFullResponse: fullResponse,
  }).catch(e => logger.error(e))

  return res
}

module.exports = customApi
