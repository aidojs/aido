const chalk = require('chalk')
const { flatten, difference } = require('lodash')

const logger = require('../logger')
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
  const { options, slash } = app.context
  const { tunnel } = options
  const slackAppBaseUrl = `https://api.slack.com/apps/${options.appId}`
  const slackAppUrls = {
    newApp: chalk`{inverse https://api.slack.com/apps?new_app=1}`,
    general: chalk`{inverse ${slackAppBaseUrl}/general?}`,
    interactive: chalk`{inverse ${slackAppBaseUrl}/interactive-messages}`,
    slash: chalk`{inverse ${slackAppBaseUrl}/slash-commands?}`,
    bots: chalk`{inverse ${slackAppBaseUrl}/bots?}`,
    oauth: chalk`{inverse ${slackAppBaseUrl}/oauth?}`,
    legacy: chalk`{inverse https://api.slack.com/custom-integrations/legacy-tokens}`,
  }
  const requiredScopes = ['commands', 'bot', 'chat:write:bot']
  let missingScopes = []
  let missingSlash = []

  if (options.getSlackProfile) { requiredScopes.push('users.profile:read') }

  const checklist = [{
    done: false,
    hints: [
      chalk`****************************************`,
      chalk`* AIDO Configuration helper            *`,
      chalk`****************************************`,
    ],
    noKill: true,
  }, {
    doneMessage: 'App is created on api.slack.com',
    done: !!options.appId,
    hints: [
      chalk`⚠️ First you need to create a Slack application :`,
      chalk`👉 Navigate to ${slackAppUrls.newApp} and create your app`,
      chalk`✍ Copy the {bold App ID} from your app's URL ({inverse https://api.slack.com/apps/XXXXXXX?created=1 })`,
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
    done: !!tunnel.custom || !!tunnel.lt,
    hints: [
      chalk`⚙ To use aido locally you will need an internet-facing URL`,
      chalk`💡 Aido can create one for you using localtunnel.me (see documentation)`,
    ],
    if: dev,
    noKill: true,
  }, {
    doneMessage: '(DEV) Local tunnel is conform ',
    done: () => tunnel.url === `https://${tunnel.lt.subDomain}.localtunnel.me`,
    hints: () => [
      chalk`⚠️ Local tunnel configuration mismatch :`,
      chalk`-> Requested : https://${tunnel.lt.subDomain}.localtunnel.me`,
      chalk`-> Obtained  : ${tunnel.url}`,
      ...options.appToken ? [
        chalk`⚙ {italic This means you should probably reconfigure your Slack application :}`,
        chalk`➕ Interactive components : {italic ${slackAppUrls.interactive}}`,
        chalk`-> Set {italic ${tunnel.url}/action}`,
        chalk`➕ Slash commands         : {italic ${slackAppUrls.slash}}`,
        chalk`-> Set {italic ${tunnel.url}/slash}`,
      ] : [
        chalk`(Maybe try requesting a less popular subdomain)`,
      ],
    ], 
    if: dev && !!tunnel.lt,
    noKill: true,
  }, {
    doneMessage: 'App token is setup',
    done: !!options.appToken,
    hints: [
      chalk`⚠️ Configuring your Slack application`,
      chalk`1 Navigate to ${slackAppUrls.interactive}`,
      chalk`-> Toggle the switch on the right hand corner`,
      chalk`-> Copy {italic ${tunnel.url}/action} in Request URL`,
      chalk`-> Save changes`,
      chalk`2 Navigate to ${slackAppUrls.slash}`,
      ...flatten(Object.keys(slash).map((key, idx) => {
        if (idx === 0) {
          return [
            chalk`-> Click 'Create New Command'`,
            chalk`-> Command     : {italic ${key}}`,
            chalk`-> Request URL : {italic ${tunnel.url}/slash}`,
          ]
        }
        return chalk`-> Repeat for command {italic ${key}} with the same Request URL`
      })),
      chalk`3 Navigate to ${slackAppUrls.bots}`,
      chalk`-> Click Add a Bot User`,
      chalk`4 Navigate to ${slackAppUrls.oauth}`,
      chalk`-> Click (Re)Install App to Workspace`,
      chalk`✍ Copy the {bold OAuth Access Token} in your configuration as appToken`,
      chalk`✍ Copy the {bold Bot User OAuth Access Token } in your configuration as botToken`,
    ],
  }, {
    doneMessage: 'API Scopes are setup',
    done: async () => {
      const { headers } = await customApi('api.test', {}, true, options.appToken)
      const availableScopes = headers['x-oauth-scopes'].split(',')
      missingScopes = difference(requiredScopes, availableScopes)
      
      return missingScopes.length === 0
    },
    hints: () => [
      chalk`⚠️ You are missing OAuth scopes :`,
      chalk`-> Navigate to ${slackAppUrls.oauth}`,
      ...missingScopes.map(scope => chalk`-> Add the {italic ${scope}} scope`),
      chalk`⚙ Don't forget to reinstall your app !`,
    ],
  }, {
    doneMessage: 'Legacy token is setup',
    done: !!options.legacyToken,
    hints: () => [
      chalk`⚠️ Aido can inspect slash commands if you provide a  in your configuratioon`,
      chalk`-> Navigate to ${slackAppUrls.legacy}, section Legacy token generator`,
      chalk`-> Generate a token and copy it in your configuration as legacyToken`,
    ],
    noKill: true,
  }, {
    doneMessage: 'Slash commands are setup',
    done: async () => {
      const res = await customApi('commands.list', {}, false, options.legacyToken).catch(e => logger.error(e))
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
    if: !!options.legacyToken,
  }, {
    doneMessage: `💪 Your app is up and running, listening on ${tunnel.url}`,
    done: true,
  }]

  await checkConfiguration(checklist)
}

module.exports = configurator
