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

  app     = express(),
  server  = http.createServer( app );
// ------------- END MODULE SCOPE VARIABLES ---------------

// ------------- BEGIN SERVER CONFIGURATION ---------------

// No need to set. By default environment will be set to development
// app.set('env', 'development');

// configuration for all environments
app.configure( function () {
    app.set('port', process.env.PORT || 5000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use( express.bodyParser() );
    app.use(express.cookieParser('!SEEkret007#'));

    app.use(express.session({
      cookie: { maxAge: 60 * 60 * 1000},
      store: new MongoStore({
        db: 'mdh-chat-admin',
        host: '192.168.0.252'
        }, function() {
          console.log('Called session store!');
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
    console.log('mdhChat server running in ' + app.get('env') + ' mode: Listening on port ' + app.get('port') );
});

// ------------------ END START SERVER --------------------
