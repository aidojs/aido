const aido = require('../../lib')
const Todo = require('./slash/todo')

// Configure global application
aido.init({
  getSlackProfile: true,
  slash: { todo: Todo },
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
