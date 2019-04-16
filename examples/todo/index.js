const path = require('path')

const aido = require('../../lib')
const Todo = require('./slash/todo')

// Configure global application
aido.configure({
  getSlackProfile: true,
  hints: true,
  persistentStorage: path.join(__dirname, 'sessions.db'),
  viewsFolder: path.join(__dirname, 'views'),
  viewsTemplateExtension: 'pug',
  // appId: 'AXXXLOLOLOL',
  // slackVerificationToken: 'xxxxxxxxxxxxxxxxx',
  // botToken: 'xoxp-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxx',
  // legacyToken: 'xoxp-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxx',
})

// Register slash commands and views
aido.registerSlash('todo', Todo)
aido.registerView('todo')
aido.registerView('addItem', true)
aido.registerView('removeItem', true)

aido.listen(3000)
