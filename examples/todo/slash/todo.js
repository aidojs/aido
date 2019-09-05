const Slash = require('../../../lib/slash')

class Todo extends Slash {
  // The following methods are standard, used internally by Aido

  /**
   * Initializes the command
   */
  init() {
    /* The default view for a Slash is the name of the command, but you can override it here */
    this.view = 'todo'
    /* By default, a Slash will store the user sessions in the persistent storage specified by the application
       Set to false for no persistent storage. In this case, all invocations will go through the initState() method */
    this.persistentState = true
    /* By default a Slash is private, meaning its response will only be visible to the user who invoked it.
       Set to false for a public Slash. In this case, the command will respond in the channel where it was invoked
       and be visible and interactive to all users of this channel. */
    this.private = true
  }

  /**
   * Initializes the command state (bypassed if a persistent state is found for this command and user)
   */
  initState() {
    return {
      items: [],
    }
  }
  
  /**
   * Handles the text arguments that were provided on command invocation.
   * Use `this.text` to get a string
   * Or `this.args` to get an array of strings (split by space)
   */
  handleText() {
    if (this.text) {
      this.addItem({ label: this.text })
    }
  }

  // The following methods are custom, used by the different views of the slash command. Grow your own ! _\|/_

  /**
   * Adds an item to the list
   * @param {Object} args
   * @param {String} args.item 
   */
  addItem({ label }) {
    this.state.items.push({
      label,
      done: false,
    })
  }

  /**
   * Removes the item at item idx in the list
   * @param {Object} args
   * @param {Number} args.idx 
   */
  removeItem({ idx }) {
    this.state.items.splice(idx, 1)
  }

  /**
   * Marks an item done or not done
   * @param {Object} args
   * @param {Number} args.idx 
   * @param {Boolean} args.done 
   */
  markDone({ idx, done = true }) {
    this.state.items[idx].done = done
  }

  /**
   * Gets the class to attribute to an item on the list
   * @param {Boolean} done 
   */
  getClass(done) {
    return done ? 'primary' : 'normal'
  }

  /**
   * Gets the formatted label for an item according to its done status
   * @param {Boolean} done 
   * @param {String} label 
   */
  getLabel(done, label) {
    return done ? `☑ ~${label}~` : `☐ ${label}`
  }

  /**
   * Returns a section color according to an item's done status
   * @param {Boolean} done 
   */
  getColor(done) {
    return done ? 'warning' : 'good'
  }
}

module.exports = Todo
