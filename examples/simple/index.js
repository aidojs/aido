const aido = require('../../lib')
const { Slash } = aido

class Simple extends Slash {
  initState() {
    return {
      value: 0,
    }
  }

  increment() {
    this.state.value += 1
  }

  decrement() {
    this.state.value -= 1
  }
}

// Configure global application
aido.init({
  viewsFolder: __dirname,
  slash: { simple: Simple },
  // tunnel: {
  //   // If you already have a tunnel setup just uncomment the following line and enter your actual tunnel URL
  //   custom: 'https://xxxxxx.ngrok.io',
  //   // Or you can let aido create one on localtunnel.me for you (and request a custom subdomain !)
  //   lt: { subDomain: 'xxxxxx' },
  // },
  // appId: 'AXXXXXXX',
  // slackVerificationToken: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
  // appToken: 'xoxp-xxxxxxxxx-xxxxxxxx',
  // botToken: 'xoxb-xxxxxxxxx',
  // legacyToken: 'xoxp-xxxxxxxxx-xxxxxxxx',
})

aido.start()
