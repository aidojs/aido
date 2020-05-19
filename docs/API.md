# Aido API Reference

## Views

Aido view templates are written using the [Pug templating language](https://pugjs.org), and then converted to Slack attachments using html2slack. For information on supported HTML tags, and how they translate into Slack attachments, please refer to the [html2slack documentation](https://www.npmjs.com/package/html2slack).

If you're not a fan of Pug, you can write plain HTML and just use pug's syntax for loops, conditions, variable interpolation etc...

### Local scope

The pug template is rendered using the current instance of the Slash commands as scope ("locals"), giving you access to the state, trigger and user informations, etc... You can also use methods present on the class.

```pug
body
  section
    p User always contains the user's Slack ID : #{user.slackId}
    p You can use methods on the Slash class : #{capitalize('hello world')}
    p And access the state directly : #{state.score}
```

```javascript
class App extends Slash {
  // ...
  capitalize(text) {
    return text.toUpperCase()
  }
  // ...
}
```

## Interactive components

### Buttons

Buttons are identified by their `name` attribute. When a user clicks a button, the corresponding method in the Slash class is executed. You can additionally provide a `value`, which will be passed as an argument to the method. The value can be a string or a javascript object.

```pug
body
  section
    button(name="doSomething") Without argument
    button(name="doOtherThing" value={ name: 'Jack' }) With argument
```

```javascript
class App extends Slash {
  // ...
  doSomething() {
    // No argument provided
  }
  doOtherThing(arg) {
    console.log(arg.name)
  }
  // ...
}
```

### Dialogs

Forms are identified by their `action` attribute, and the inputs are identified by their `name`. The content of the inputs is passed as an argument to the corresponding method on the Slash class. *Please refer to the html2slack documentation for complete field reference.*

```pug
body(class="modal")
  section
    form(action="save")
      header My form
        label A text input
          input(type="text" name="textInput")
        label A select
          select(name="selectInput")
            option(value="foo") Foo
            option(value="bar") Bar
            option(value="baz") Baz
        input(type="submit" value="Enregistrer")
```

```javascript
class App extends Slash {
  // ...
  save(arg) {
    console.log(arg.textInput)
    console.log(arg.selectInput)
  }
  // ...
}
```

### Custom templaters
If you'd like to code your views totally differently, you can pass a custom templater on aido initialization. If your custom templater outputs HTML, you can use `next` to send it through html2slack for conversion. Below is the commented code for the default Pug templater :

```javascript
/**
 * Renders a pug view and converts it with html2slack
 * @param {Object}   view           - An aido view
 * @param {String}   view.name      - The name of the view
 * @param {Boolean}  view.modal     - True if the view should be rendered as a Slack Dialog
 * @param {String}   view.template  - The view template in Pug
 * @param {Object}   locals         - The current Slash instance is used as context for rendering the view
 * @param {Object}   locals.state   - The state of the session with the current user
 * @param {Function} next           - This simply sends the templated HTML through html2slack
 * @returns {Object}
 */
async function pugTemplater(view, locals, next) {
  const templatedHtml = pug.render(view.template ,locals)
  return next(templatedHtml)
}

// We pass our custom templater when initializing our aido application
aido.init({ template: pugTemplater })
```
