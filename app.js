/*
 * app.js - Express server with routing
*/

/*jslint         node    : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global */

// ------------ BEGIN MODULE SCOPE VARIABLES --------------
'use strict';
var
  http    = require( 'http'         ),
  express = require( 'express'      ),
  routes  = require( './lib/routes' ),
  path    = require( 'path'         ),
  MongoStore = require('connect-mongo')(express),
  config     = require('./lib/config'), cfg,
  app     = express(),
  server  = http.createServer( app );
// ------------- END MODULE SCOPE VARIABLES ---------------

// ------------- BEGIN SERVER CONFIGURATION ---------------

// No need to set env. By default environment will be set to development
// app.set('env', 'development');

cfg = config[app.get('env')];

// configuration for all environments
app.configure( function () {
    app.set('port', process.env.PORT || 5000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use( express.bodyParser() ); // used for POST data (available in req.body)
    app.use(express.cookieParser('!SEEkret007#'));

    app.use(express.session({
      cookie: { maxAge: 60 * 60 * 1000},
      store: new MongoStore({
        url : cfg.mongoDbUri
        }, function() {
          console.log('*** Called MongoDB session store in', cfg.mode, 'mode ***');
        })
      })
    );
    app.use( express.static( __dirname + '/public' ) );
    app.use( app.router );
});

// development environment only
app.configure( 'development', function () {
  // app.use( express.logger() );
  app.use( express.errorHandler({
    dumpExceptions : true,
    showStack      : true
  }) );
});

// production environment only
app.configure( 'production', function () {
  app.use( express.errorHandler() );
});

routes.configRoutes( app, server );
// -------------- END SERVER CONFIGURATION ----------------

// ----------------- BEGIN START SERVER -------------------
server.listen(app.get('port'), function() {
    console.log('*** mdhChat server running in', app.get('env'),
      'mode (port', app.get('port') + ') ***');
});

// ------------------ END START SERVER --------------------
