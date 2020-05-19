require('dotenv').config()

const aido = require('../../lib')
const { Slash } = aido

class Number extends Slash {
  /**
   * Initializes the internal state of the application
   */
  initState() {
    return {
      number: 0
    }
  }

  /**
   * Increments the number. This method will be called by clicking the first button.
   * (because it has the same `name` as the button)
   */
  increment() {
    this.state.number += 1
  }

  /**
   * Decrements the number. This method will be called by clicking the second button.
   * (because it has the same `name` as the button)
   */
  decrement() {
    this.state.number -= 1
  }
}

// Configure global application
aido.init({
  viewsFolder: __dirname,
  slash: { number: Number },
  signingSecret: process.env['SIGNING_SECRET'],
  appToken: process.env['APP_TOKEN'],
})
aido.start()
