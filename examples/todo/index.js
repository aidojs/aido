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
  slackVerificationToken: 'PE1gvdLlApVrdEKB4YUeaP1X',
  botToken: 'xoxp-26655536611-168801474546-455596679361-25383179482bb86765251cbc3dbfd8ce',
  appId: 'ADFGTV25C',
})

// Register slash commands and views
aido.registerSlash('todo', Todo)
aido.registerView('todo')
aido.registerView('addItem', true)
aido.registerView('removeItem', true)

aido.listen(3000)
