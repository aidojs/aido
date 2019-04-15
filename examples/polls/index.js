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
  // appId: 'AHV55743S',
  // slackVerificationToken: '6wxydihpt0AnuG7cB39gMXkl',
  // botToken: 'xoxp-284476586484-284435374338-607434076736-0db6220bfa82a89bf044f2e089407905',
  // legacyToken: 'xoxp-284476586484-284435374338-595973987139-f948ddc1f0f45404a54e19566d87b9d8',
  appId: 'ADFGTV25C',
  slackVerificationToken: 'PE1gvdLlApVrdEKB4YUeaP1X',
  botToken: 'xoxp-26655536611-168801474546-455596679361-25383179482bb86765251cbc3dbfd8ce',
  legacyToken: 'xoxp-26655536611-168801474546-444605398785-ebd4e874791389e49bdba65681035ec2',
  // Use the following option if you don't want aido to check that slash commands are installed on your workspace
  // noCommandIntrospection: true,
})

// Register slash commands and views
aido.registerSlash('polack', Polack)
aido.registerView('editPoll', true)
aido.registerView('viewPoll')
aido.registerView('poll')

aido.listen(3000)
