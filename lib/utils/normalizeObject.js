const { camelCase, mapKeys, mapValues, isPlainObject } = require('lodash')

/**
 * Recursively camelCases the keys of an object
 * @param {Object} object
 * @returns {Object}
 */
const normalizeObject = object => mapKeys(
  mapValues(object, value => isPlainObject(value)
    ? normalizeObject(value)
    : value
  ),
  (val, key) => camelCase(key)
)

module.exports = normalizeObject
