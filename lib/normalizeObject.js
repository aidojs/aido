const { camelCase, mapKeys } = require('lodash')

const normalizeObject = object => mapKeys(object, (val, key) => camelCase(key))

module.exports = normalizeObject
