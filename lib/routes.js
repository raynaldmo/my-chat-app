/*
 * routes.js - module to provide routing
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
  configRoutes,
  admin        = require( './admin-srv'),
  chat         = require( './chat' );
// ------------- END MODULE SCOPE VARIABLES ---------------

// ---------------- BEGIN PUBLIC METHODS ------------------
configRoutes = function ( app, server ) {
  app.get( '/', function ( req, res ) {
    res.redirect( '/chat.html' );
  });

  app.get( '/login', admin.login); // Login form
  app.post( '/login', admin.doLogin); // Login action
  app.get( '/logout', admin.doLogout);
  app.get( '/admin', admin.list); // main admin page

  chat.connect( server );
};

module.exports = { configRoutes : configRoutes };
// ----------------- END PUBLIC METHODS -------------------
