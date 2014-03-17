/*
 * chat.js
 * Root namespace module
*/

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global $, mdhChat */

// var console = {};
// console.log = function () {};

var mdhChat = (function ($container) {
  'use strict';

  var initModule = function () {
    mdhChat.data.initModule();
    mdhChat.model.initModule();
    mdhChat.shell.initModule($container);
  };

  return { initModule: initModule };
}());
