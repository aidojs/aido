const path = require('path')

const aido = require('../../lib')
const Polack = require('./slash/polack')

// Configure global application
aido.configure({
  getSlackProfile: true,
  hints: true,
  persistentStorage: path.join(__dirname, 'sessions.db'),
  viewsFolder: path.join(__dirname, 'views'),
  viewsTemplateExtension: 'pug',
  localtunnel: {
    subDomain: 'polack-test',
    // If you already have a tunnel setup just uncomment the following line and enter your actual tunnel URL
    custom: 'https://aido-test.ngrok.io',
  },
  // appId: 'AXXXLOLOLOL',
  // slackVerificationToken: 'xxxxxxxxxxxxxxxxx',
  // botToken: 'xoxp-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxx',
  // legacyToken: 'xoxp-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxx',
  // Use the following option if you don't want aido to check that slash commands are installed on your workspace
  // noCommandIntrospection: true,
})

// Register slash commands and views
aido.registerSlash('polack', Polack)
aido.registerView('editPoll', true)
aido.registerView('viewPoll')
aido.registerView('poll')

aido.listen(3000)
