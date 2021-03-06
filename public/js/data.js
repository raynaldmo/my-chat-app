/*
 * data.js
 * Data module
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global $, io, mdhChat */

mdhChat.data = (function () {
  'use strict';
  var
    moduleName = '[data] ',
    stateMap = { sio : null },
    makeSio, getSio, initModule;

  makeSio = function (){
    var socket = io.connect( '/chat' );

    console.log(moduleName + 'io.connect /chat');

    return {
      emit : function ( event_name, data ) {
        console.log(moduleName + 'socket.emit -> ' + event_name);
        socket.emit( event_name, data );
      },
      on   : function ( event_name, callback ) {
        console.log(moduleName + 'socket.on -> ' + event_name);
        socket.on( event_name, function (){
          callback( arguments );
        });
      },
      off : function (event_name, callback) {
        console.log(moduleName + 'socket.off -> ' + event_name);
        socket.removeListener(event_name, function() {
          callback(arguments);
        });
      },
      remove : function(event_name) {
        console.log(moduleName + 'socket.remove -> ' + event_name);
        socket.removeAllListeners(event_name);
      }
    };
  };

  getSio = function (){
    if ( ! stateMap.sio ) { stateMap.sio = makeSio(); }
    return stateMap.sio;
  };

  initModule = function (){ console.log(moduleName + 'initModule')};

  return {
    getSio     : getSio,
    initModule : initModule
  };
}());
