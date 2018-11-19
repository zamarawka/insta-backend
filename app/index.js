#!/usr/bin/env node

// Load APM on production environment
// const apm = require('./apm');

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const mount = require('koa-mount');
const cors = require('@koa/cors');

const errorHandler = require('./middlewares/errorHandler');
const logMiddleware = require('./middlewares/log');
const requestId = require('./middlewares/requestId');
const responseHandler = require('./middlewares/responseHandler');

const logger = require('./logger');
const router = require('./router');
const server = require('./server');
const db = require('./database');
const auth = require('./auth');
const appPaths = require('./paths');
const config = require('./config');

const app = new Koa();

// Trust proxy
app.proxy = true;

// Set middlewares
app.use(
  mount(
    config.staticUrlPrefix,
    serve(appPaths.rootResolve(config.uploadPath))
  )
);
app.use(
  bodyParser({
    enableTypes: ['json', 'form', 'text'],
    formLimit: '10mb',
    jsonLimit: '10mb'
  })
);
app.use(requestId());
app.use(
  cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
    exposeHeaders: ['X-Request-Id']
  })
);
app.use(responseHandler());
app.use(errorHandler());
app.use(logMiddleware({ logger }));

// Auth
app.use(auth.initialize());

// Bootstrap application router
app.use(router.routes());
app.use(router.allowedMethods());

function onError(err, ctx) {
  // if (apm.active) {
  //   apm.captureError(err);
  // }

  if (ctx == null) {
    logger.error({ err, event: 'error' }, 'Unhandled exception occured');
  }
}

// Handle uncaught errors
app.on('error', onError);

db.connect()
  .catch((e) => {
    logger.error({ event: 'database' }, 'Data base connection failed', e);
  });

// Start server
if (!module.parent) {
  server.start(app)
    .then((instance) => {
      instance.on('error', onError);
    });
}

// Expose app
module.exports = app;
