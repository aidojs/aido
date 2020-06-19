const aido = require('../../lib')
const Polack = require('./slash/polack')
const pollsPlugin = require('./plugins/polls')

// Configure global application
aido.init({
  getSlackProfile: true,
  slash: { polack: Polack },
  plugins: [pollsPlugin],
  // tunnel: {
  //   // If you already have a tunnel setup just uncomment the following line and enter your actual tunnel URL
  //   custom: 'https://xxxxxx.ngrok.io',
  // },
  // appId: 'AXXXXXXX',
  // slackVerificationToken: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
  // appToken: 'xoxp-xxxxxxxxx-xxxxxxxx',
  // botToken: 'xoxb-xxxxxxxxx',
  // legacyToken: 'xoxp-xxxxxxxxx-xxxxxxxx',
})

aido.start(3000)
