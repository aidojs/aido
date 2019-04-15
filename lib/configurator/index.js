const chalk = require('chalk')
const { flatten, difference } = require('lodash')

const checkConfiguration = require('./checkConfiguration')
const customApi = require('./customApi')
/**
 * TODO
 * Use chat.command to test slash commands https://github.com/ErikKalkoken/slackApiDoc/blob/master/chat.command.md
 * Use the scopes in the headers of webhooks to check available scopes
 */


/**
 * Provides contextual hints on how to configure the Slack application
 * @param {Object}  app  - your Koa application
 * @param {Boolean} dev  - true if the application is running in dev mode
 */
async function configurator(app, dev) {
  const { options, tunnel, slash } = app.context
  const slackAppBaseUrl = `https://api.slack.com/apps/${options.appId}`
  const slackAppUrls = {
    general: chalk`{bgBlue.red ${slackAppBaseUrl}/general?}`,
    interactive: chalk`{bgBlue.red ${slackAppBaseUrl}/incoming-webhooks}`,
    slash: chalk`{bgBlue.red ${slackAppBaseUrl}/slash-commands?}`,
    oauth: chalk`{bgBlue.red ${slackAppBaseUrl}/oauth?}`,
    legacy: chalk`{bgBlue.red https://api.slack.com/custom-integrations/legacy-tokens}`,
  }
  const requiredScopes = ['commands', 'bot', 'chat:write:bot']
  let missingScopes = []
  let missingSlash = []

  if (options.getSlackProfile) { requiredScopes.push('users.profile:read') }

  const checklist = [{
    doneMessage: 'App is created on api.slack.com',
    done: !!options.appId,
    hints: [
      chalk`⚠️ First you need to create a Slack application :`,
      chalk`👉 Navigate to {bgBlue.red https://api.slack.com/apps?new_app=1} and create your app`,
      chalk`✍ Copy the {bold App ID} from your app's URL ({bgBlue.red https://api.slack.com/apps/XXXXXXX?created=1 })`,
    ],
  }, {
    doneMessage: 'Verification token is setup',
    done: !!options.slackVerificationToken,
    hints: [
      chalk`⚠️ No Verification Token in your configuration :`,
      chalk`👉 Navigate to ${slackAppUrls.general}, section {bold App Credentials}`,
      chalk`✍ Copy the {bold Verification Token} in your configuration`,
    ],
  }, {
    doneMessage: '(DEV) Local tunnel is setup',
    done: !!tunnel,
    hints: [
      chalk`⚙ To use aido locally you will need an internet-facing URL`,
      chalk`💡 Consider using the localtunnel options on your application - it's free !`,
    ],
    if: dev,
  }, {
    doneMessage: 'Bot token is setup',
    done: !!options.botToken,
    hints: [
      chalk`⚠️ No Bot Token in your configuration :`,
      chalk`👉 Navigate to ${slackAppUrls.interactive}`,
      chalk`-> Toggle on and copy {italic ${tunnel.url}/action} in Request URL`,
      chalk`👉 Navigate to ${slackAppUrls.slash}`,
      ...flatten(Object.keys(slash).map((key, idx) => {
        if (idx === 0) {
          return [
            chalk`➕ Click 'Create New Command'`,
            chalk`-> Command     : {italic ${key}}`,
            chalk`-> Request URL : {italic ${tunnel.url}/slash}`,
          ]
        }
        return chalk`➕ Repeat for command {italic ${key}} with the same Request URL`
      })),
      chalk`👉 Navigate to ${slackAppUrls.oauth}`,
      chalk`-> Click Install App to Workspace`,
      chalk`✍ Copy the {bold OAuth Access Token} in your configuration as botToken`,
    ],
  }, {
    doneMessage: '(DEV) Local tunnel is conform ',
    done: options.localtunnel.custom || tunnel.url === `https://${options.localtunnel.subDomain}.localtunnel.me`,
    hints: [
      chalk`⚠️ Local tunnel configuration mismatch :`,
      chalk`-> Requested : https://${options.localtunnel.subDomain}.localtunnel.me`,
      chalk`-> Obtained  : ${tunnel.url}`,
      chalk`⚙ {italic This means you should probably reconfigure your Slack application :}`,
      chalk`➕ Interactive components : {italic ${slackAppUrls.interactive}}`,
      chalk`-> Set {italic ${tunnel.url}/action}`,
      chalk`➕ Slash commands         : {italic ${slackAppUrls.slash}}`,
      chalk`-> Set {italic ${tunnel.url}/slash}`,
    ],
    if: dev && !!tunnel,
    noKill: true,
  }, {
    doneMessage: 'API Scopes are setup',
    done: async () => {
      const { headers } = await customApi('api.test', {}, true, options.botToken)
      const availableScopes = headers['x-oauth-scopes'].split(',')
      missingScopes = difference(requiredScopes, availableScopes)
      
      return missingScopes.length === 0
    },
    hints: () => [
      chalk`⚠️ You are missing OAuth scopes :`,
      chalk`👉 Navigate to ${slackAppUrls.oauth}`,
      ...missingScopes.map(scope => chalk`-> Add the {italic ${scope}} scope`),
      chalk`⚙ Don't forget to reinstall your app !`,
    ],
  }, {
    doneMessage: 'Legacy token is setup',
    done: !!options.legacyToken,
    hints: () => [
      chalk`⚠️ To allow slash commands introspection, you need to setup a legacy token :`,
      chalk`👉 Navigate to ${slackAppUrls.legacy}, section Legacy token generator`,
      chalk`-> Click Request Token for your workspace`,
      chalk`✍ Copy the {bold Legacy Token} in your configuration as legacyToken`,
      chalk`(use option noCommandIntrospection to ignore this message)`,
    ],
    if: () => !options.noCommandIntrospection,
  }, {
    doneMessage: 'Slash commands are setup',
    done: async () => {
      const res = await customApi('commands.list', {}, false, options.legacyToken).catch(e => console.log(e))
      const availableSlash = Object.values(res.commands)
        .filter(command => command.type === 'app')
        .map(command => command.name.replace('/', ''))
      const requiredSlash = Object.keys(slash)
      missingSlash = difference(requiredSlash, availableSlash)
      return missingSlash.length === 0
    },
    hints: () => [
      chalk`⚠️ You are missing some slash commands on your workspace`,
      chalk`👉 Navigate to ${slackAppUrls.slash}`,
      ...flatten(missingSlash.map((command, idx) => {
        if (idx === 0) {
          return [
            chalk`➕ Click 'Create New Command'`,
            chalk`-> Command     : {italic ${command}}`,
            chalk`-> Request URL : {italic ${tunnel.url}/slash}`,
          ]
        }
        return chalk`➕ Repeat for command {italic ${command}} with the same Request URL`
      })),
    ],
  }, {
    doneMessage: `💪 Your app is up and running, listening on ${tunnel.url}`,
    done: true,
  }]

  await checkConfiguration(checklist)
}

module.exports = configurator
