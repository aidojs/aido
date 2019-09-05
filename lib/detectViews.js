const fs = require('fs')
const path = require('path')
const lex = require('pug-lexer')

const logger = require('./logger')

/**
 * Unpacks a view : parses the template and determines whether it is modal or not
 * @param {String} name     - The name of the view
 * @param {String} viewPath - The path to the view
 * @returns {Object} { }
 */
function unpackView(name, template) {
  // Use pug lexer to find if the body is a modal or not
  const tokens = lex(template)
  let inBody, inAttributes, finished
  // We want to find an attribute class
  const modal = tokens.some(token => {
    if (finished) {
      return false
    }
    // Detect beginning of body tag
    if (token.type === 'tag' && token.val === 'body') {
      inBody = true
      return false
    }
    // Ignore tokens not in body
    if (!inBody) {
      return false
    }
    // Entering another tag. Detection is finished as no relevant attribute has been found in body
    if (token.type === 'tag') {
      finished = true
      return false
    }
    // Detect beginning of body attributes
    if (token.type === 'start-attributes') {
      inAttributes = true
      return false
    }
    // Ignore tokens not in attributes
    if (!inAttributes) {
      return false
    }
    // Detect end of attributes. Detection is finished as no relevant attribute has been found in body
    if (token.type === 'end-attributes') {
      finished = true
      return false
    }
    // Detect class="modal" attribute
    if (token.type === 'attribute' && token.name === 'class' && /(\s|")modal(\s|")/.test(token.val)) {
      return true
    }
  })
  return {
    name,
    modal,
    template,
  }
}

/**
 * Detect all views in the views folder and unpacks them
 * @param {String} viewsFolder
 * @param {String} viewsTemplateExtension
 * @returns {Object[]} an object containing all the views
 */
function detectViews(viewsFolder, viewsTemplateExtension) {
  if (!fs.existsSync(viewsFolder)) {
    logger.error('Views folder does not exist', { viewsFolder })
    throw new Error('Views folder does not exist')
  }
  const viewFiles = fs.readdirSync(viewsFolder)
  return viewFiles
    .filter(viewFile => path.extname(viewFile) === `.${viewsTemplateExtension}`)
    .reduce((views, viewFile) => {
      // Load template
      const viewName = path.basename(viewFile,`.${viewsTemplateExtension}`)
      const template = fs.readFileSync(path.join(viewsFolder, viewFile), { encoding: 'utf-8' })
      views[viewName] = unpackView(viewName, template)
      return views
    }, {})
}

module.exports = {
  unpackView,
  detectViews,
}
