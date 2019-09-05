# Aido

_Slack applications made simple !_

Aido is a javascript framework to write Slack applications in a clean and simple way. Its intent is to take away the specificities of the Slack API, and make Slack bots code more like regular old web applications.

You can think of Aido as being a very simple Single Page App framework, where your app renders as Slack messages instead of a page in a browser :

- Your views are designed as HTML pages and rendered with [html2slack](https://www.npmjs.com/package/html2slack)
- Your controllers are simple Javascript classes, which can interpret Slack interactions such as slash commands, button clicks and dialog inputs
- Your view is updated every time the state is updated
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

## Setting up your Slack application

As it stands, your aido application can't interact with Slack because it is lacking the necessary tokens. Not to worry ! The auto-configurator will help you get everything setup. There is currently no API to configure Slack applications programmatically, but the configurator acts as a mini-tutorial which will guide you through the Slack interfaces.

To start the auto-configurator, you just need to run your application in dev mode : `node index.js dev`.

## Configuration options

You can customize your aido application using `aido.configure` before you start the server. This is also where you will setup your Slack API tokens :

```javascript
aido.configure({
  getSlackProfile: true,
  hints: true,
  persistentStorage: path.join(__dirname, 'sessions.db'),
  viewsFolder: path.join(__dirname, 'views'),
  viewsTemplateExtension: 'pug',
  appId: 'AXXXLOLOLOL',
  slackVerificationToken: 'xxxxxxxxxxxxxxxxx',
  appToken: 'xoxp-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxx',
  legacyToken: 'xoxp-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxx',
})
```

Here is the detail of the various configuration options :

**getSlackProfile** (Boolean - default _true_)

If `getSlackProfile` is true, then aido will, for each hit on your application, fetch the complete Slack profile of the user. This includes the title, status, real name, email and profile pictures of the user. If you are on a Pro workspace, this will also include all the custom fields setup for this user.

**template** (Function)

Currently aido only supports PUG templates out of the box, but you can provide your own templater, optionnally passing the result to html2slack. The templater will be called with 3 arguments :

*view* - A standard aido view. A view is a plain old javascript object that looks like this :

```javascript
{
  name: 'nameOfYourView',
  template: '...',        // Your view template represented as a string
  modal: true,            // True if the view is to be rendered as a modal (or Slack dialog : https://api.slack.com/dialogs)
}
```

*locals* - Your command class (extension of the Slash class), to be used as local context

*next* - Use next as a callback to send the output to html2slack, which will convert your templated HTML to Slack attachments. If your templater directly renders the Slack attachments, you can ignore this callback.

As an example, you can consult the [default Pug templater](lib/templaters/pug.js).

**viewsFolder** (String - default `${__dirname}/views/`)

The absolute path to your views folder.

**viewsTemplateExtension** (String - default `pug`)

If you are not using the default PUG templater, you might need to specify the extension of your view templates.

**hints** (Boolean - default `true`)

Set `hints` to false if you want to toggle off the auto-configurator.
