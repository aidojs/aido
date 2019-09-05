const aido = require('../../lib')
const Polack = require('./slash/polack')
const pollsPlugin = require('./plugins/polls')

// Configure global application
aido.init({
  getSlackProfile: true,
  slash: { polack: Polack },
  plugins: [pollsPlugin],
  tunnel: {
    // If you already have a tunnel setup just uncomment the following line and enter your actual tunnel URL
    custom: 'https://aido-test.ngrok.io',
  },
  appId: 'ADFGTV25C',
  slackVerificationToken: 'l6QWLDSRgbWYO7oqG28t7yFh',
  appToken: 'xoxp-26655536611-168801474546-743125131991-1f728d2158b04ad368151fb01bd10ff8',
  botToken: 'xoxb-236786829587-4jE6wkRi4UuuJTVku8wxcOc1',
  legacyToken: 'xoxp-26655536611-168801474546-741269345328-ad0ca072c1cabb847b894d0eaa9dc077',
})

aido.start(3000)
