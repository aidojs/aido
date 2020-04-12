const { createLogger, transports, format } = require('winston')

const logger = createLogger({
  format: format.combine(
    format.errors({ stack: true }),
    format.metadata(),
    format.json(),
  ),
  transports: [new transports.Console()],
})

module.exports = logger
