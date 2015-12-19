'use strict';

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');

const mongoStore = require('connect-mongo')(session);
const config = require('config');
const appRoot = require('app-root-path');

module.exports = function (app, passport) {

  // Static files middleware
  app.use('/', express.static(appRoot + '/static'));
  app.use('/', express.static(appRoot + '/questions'));

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());

  // CookieParser should be above session
  app.use(cookieParser());
  app.use(cookieSession({
    secret: 'secret',
    domain: config.get('domain') || null
  }));
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.get('secret') || 'ctfileapi',
    store: new mongoStore({
      url: (process.env['MONGO_PORT_27017_ADDR'] && process.env['$MONGO_PORT_27017_TCP_PORT']) ?
        `mongodb://${process.env['$MONGO_PORT_27017_TCP_ADDR']}:${process.env['$MONGO_PORT_27017_TCP_PORT']}/yehd`:
        config.get('db'),
      collection : 'sessions'
    })
  }));

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());
};
