const localtunnel = require('localtunnel')

/**
 * A simple wrapper over localtunnel's ugly callback driven syntax
 * @param {Number} port      - the port number on which your app is listening
 * @param {String} subDomain - a specific subdomain on the proxy server. Please keep it very specific to ensure you get
 *                             it every time you restart your application
 * @param {String} localHost - the hostname where requests should be proxied instead of localhost
 */
function localTunnel(port, subDomain = '', localHost = 'localhost') {
  const options = {
    subdomain: subDomain,
    local_host: localHost,
  }
  return new Promise((resolve, reject) => {
    localtunnel(port, options, (err, tunnel) => {
      if (err) {
        return reject(err)
      } else {
        resolve(tunnel)
      }
    })
  })
}

module.exports = localTunnel
