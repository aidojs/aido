# Aido

_Slack applications made simple !_

Aido is a javascript framework to write Slack applications in a clean and simple way. Its intent is to take away the specificities of the Slack API, and make Slack bots code more like regular old web applications.

You can think of Aido as being a very simple Single Page App framework, where your app renders as Slack messages instead of pages in a browser :

- Your views are designed as HTML pages and rendered with [html2slack](https://www.npmjs.com/package/html2slack)
- Your controllers are simple Javascript classes, which can interpret Slack interactions such as slash commands, button clicks and dialog inputs
- A basic state management system is provided, which persists user data in an SQLite database (although you are free to use your own data layer)

All in all, you just need to worry about writing your application, and Aido does all the heavy lifting of communicating to and from Slack. As an added bonus, it includes an interactive configuration tutorial to help you setup your application in your Slack workspace. The configurator will guide you through the installation of your application, the retrieval of all relevant OAuth tokens, the creation of your Slack commands and the attribution of the required OAuth scopes.

## A basic example

_More complete examples can be found in the /examples folder_

Let's create a very simple Slack application : it will display a number, which we can increment or decrement by clicking on two buttons.

First we describe our view using the Pug templating language
```pug
# /views/app.pug
body
  section
    p #{state.number}
  section
    button(name="increment") Add 1
    button(name="decrement") Remove 1
```

Then we create our Javascript program :
```javascript
const aido = require('aido')

// This is our controller
class App extends aido.Slash {
  /**
   * Initializes the internal state of the application
   */
  initState() {
    return {
      number: 0
    }
  }

  /**
   * Increments the number
   */
  increment() {
    this.state.number++
  }

  /**
   * Decrements the number
   */
  decrement() {
    this.state.number--
  }
}

// Now we just have to declare our Slash command and our view
aido.registerSlash('app', App)
aido.registerView('app') // Unless otherwise specified, we will look for an app.pug file in the /views folder

// Finally we just start the Aido server on port 3000
aido.listen(3000)
```
