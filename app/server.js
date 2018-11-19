const config = require('./config');
const logger = require('./logger');

module.exports.start = async (app) => {
  const server = app.listen(config.port, config.host, () => {
    logger.info({ event: 'execute' }, `API server listening on ${config.host}:${config.port}, in ${config.env}`);
  });

  return server;
};
