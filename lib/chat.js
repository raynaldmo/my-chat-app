/*
 * chat.js - module to provide chat messaging
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
  emitUserList, signUp, signUpFail, signIn, signInFail, signOut, chatObj,
  signUpUser,
  io = require( 'socket.io' ),
  crud   = require( './crud'    ),
  bcrypt = require( 'bcrypt'    ),
  chatterMap  = {};
// ------------- END MODULE SCOPE VARIABLES ---------------

// ---------------- BEGIN UTILITY METHODS -----------------

// sign-up new user by entering user info into DB
// bcrypt is used to hash password. hashed password is stored in DB
signUpUser = function (io, user_map, socket) {
  var result_map, cid = user_map.cid;

  user_map.is_online = false;

  bcrypt.genSalt(10, function(err, salt) {
    console.log('[genSalt]', ' typeof salt:', typeof salt,
      ' salt:', salt, ' err:', err);
    if (err) {
      signUpFail(io, user_map, socket);
    } else {
      bcrypt.hash(user_map.passwd, salt, function(err, hash) {
        console.log('[hash]', ' typeof hash:', typeof hash,
          ' hash:', hash, ' err:', err);
        if (err) {
          signUpFail(io, user_map, socket);
        } else {
          user_map.passwd = hash;
          delete user_map.cid; // we don't store the client id
          user_map.signed_up = (new Date()).toLocaleDateString();
          user_map.last_sign_in = 'Never';

          crud.construct(
            'user',
            user_map,
            function ( result_list ) {
              result_map     = result_list[ 0 ];
              result_map.cid = cid;
              signUp(io, result_map, socket);
            }
          );
        }

      });
    }
  });
};

// emitUserList - broadcast user list to all connected clients
//
emitUserList = function ( io ) {
  crud.read(
    'user',
    { is_online : true },
    {},
    function ( result_list ) { // result_list will contain all online users!
      // TBD - delete hashed passwords from result_list!
      // console.log("[emitUserList] -> ", result_list);
      io
          .of( '/chat' )
          .emit( 'listchange', result_list );
    }
  );
};

// signUp - send success message to user
//
signUp = function ( io, user_map, socket ) {
  console.log("[signUp] -> ", user_map);

  delete user_map.passwd;
  socket.emit( 'sign-up-success', user_map );
};

// signUpFail - send fail message to user
//
signUpFail = function ( io, user_map, socket ) {
  console.log("[signUpFail] -> ", user_map);

  delete user_map.passwd;
  socket.emit( 'sign-up-fail', user_map );
};

// signIn - update is_online property and chatterMap
//
signIn = function ( io, user_map, socket ) {
  console.log("[signIn] -> ", user_map);

  crud.update(
    'user',
    { '_id'         : user_map._id },
    { is_online     : true,
      last_sign_in  : (new Date()).toLocaleString()
    },

    function ( result_map ) {
      emitUserList( io );
      delete user_map.passwd;
      user_map.is_online = true;
      socket.emit( 'sign-in-success', user_map );
    }
  );

  chatterMap[ user_map._id ] = socket;
  socket.user_id = user_map._id;
};

// signInFail - send fail message to user
//
signInFail = function ( io, user_map, socket ) {
    console.log("[signInFail] -> ", user_map);

    delete user_map.passwd;
    socket.emit( 'sign-in-fail', user_map );
};

// signOut - update is_online property and chatterMap
//
signOut = function ( io, user_id ) {
  console.log("[signOut] -> ", user_id);

  crud.update(
    'user',
    { '_id'     : user_id },
    { is_online : false   },
    function ( result_list ) { emitUserList( io ); }
  );
  delete chatterMap[ user_id ];
};
// ----------------- END UTILITY METHODS ------------------

// ---------------- BEGIN PUBLIC METHODS ------------------
chatObj = {
  io_map : {io: null, socket: null},

  set_io : function(io, socket) {
    chatObj.io_map.io = io;
    chatObj.io_map.socket = socket;
  },

  get_io : function() {
    return chatObj.io_map;
  },

  listen: function(server) {
    return io.listen( server );
  },

  configure: function(io) {
    io.configure('production', function(){
      // send minified client
      io.enable('browser client minification');
      // apply etag caching logic based on version number
      io.enable('browser client etag');
      // gzip the file
      io.enable('browser client gzip');
      // reduce logging
      io.set('log level', 1);

      io.set('transports', [
        'websocket'
        , 'flashsocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
      ]);
    });

    io.configure('development', function(){
      io.set('transports', ['websocket']);
    });
  },

  connect : function(io) {
    // Begin io setup
    io
      .set( 'blacklist' , [] )
      .of( '/chat' )
      .on( 'connection', function ( socket ) {

        // Begin /sign-up-user/ message handler
        // Summary   : Provides sign-up capability.
        // Arguments : A single user_map object.
        //   user_map should have the following properties:
        //     cid     = the client id
        //     name    = the name of the user
        //     email   = email address of the user
        //     passwd  = password of the user
        // Action    :
        //   If a user with the provided username already exists
        //     in MongoDB, send error message back to user
        //
        //   If a user with the provided username does not exist
        //     in Mongo, create one and use it.
        //      (Later on we will send an email to user confirming sign-up
        //      before storing user info in database)
        //   Send a 'user-signed-up' message to the sender so that
        //     a sign-in cycle can complete.  Ensure the client id
        //     is passed back so the client can correlate the user,
        //     but do not store it in MongoDB.
        //   Mark the user as online and send the updated online
        //     user list to all clients, including the client that
        //     originated the 'sign-up-user' message.
        //

        chatObj.set_io(io, socket);

        socket.on( 'sign-up-user', function ( user_map ) {
          crud.read(
            'user', // guaranteed to pass checkType() check !
            { name : user_map.name }, // find user by name
            {}, // options
            function ( result_list ) {
              var
                result_map, passwd_hash,
                cid = user_map.cid;

              // user with that name already exists
              if ( result_list.length > 0 ) {
                result_map     = result_list[ 0 ];
                result_map.cid = cid;
                signUpFail(io, result_map, socket);
              }
              // create new user
              else {
                signUpUser(io, user_map, socket);
              }
            }
          );
        });
        // End /sign-up-user/ message handler

        // Begin /sign-in-user/ message handler
        // Summary   : Provides sign-in capability.
        // Arguments : A single user_map object.
        //   user_map should have the following properties:
        //     cid     = the client id
        //     name    = the name of the user
        //     passwd  = password of the user
        // Action    :
        //   If the username or password is wrong, call signInFail()
        //   If username and password is ok, call signInSuccess.
        //   signInSuccess
        //   sends a 'sign-in-success' message to the sender so that
        //     a sign-in cycle can complete.  Ensure the client id (cid)
        //     is passed back so the client can correlate the user,
        //     but do not store it in MongoDB.
        //   Mark the user as online and send the updated online
        //     user list to all clients, including the client that
        //     originated the 'sign-in-user' message.
        //
        socket.on( 'sign-in-user', function ( user_map ) {
          crud.read(
            'user',
            { name : user_map.name },
            {},
            function ( result_list ) {
              var
                result_map,
                cid = user_map.cid;

              if ( result_list.length > 0 ) {
                result_map     = result_list[ 0 ];
                result_map.cid = cid;

                // check password
                bcrypt.compare(user_map.passwd, result_map.passwd, function(err, res) {
                  if (err) {
                    signInFail(io, result_map, socket);
                  } else {
                    if (res == true) {
                      signIn( io, result_map, socket );
                    } else {
                      signInFail(io, result_map, socket);
                    }
                  }
                });
              } else {
                // no user by that name!
                signInFail(io, user_map, socket);
              }
            }
          );
        });
        // End /sign-in-user/ message handler

        // Begin /updatechat/ message handler
        // Summary   : Handles messages for chat.
        // Arguments : A single chat_map object.
        //  chat_map should have the following properties:
        //    dest_id   = id of recipient
        //    dest_name = name of recipient
        //    sender_id = id of sender
        //    msg_text  = message text
        // Action    :
        //   If the recipient is online, the chat_map is sent to her.
        //   If not, a 'user has gone offline' message is
        //     sent to the sender.
        //
        socket.on( 'updatechat', function ( chat_map ) {
          if ( chatterMap.hasOwnProperty( chat_map.dest_id ) ) {
            chatterMap[ chat_map.dest_id ]
              .emit( 'updatechat', chat_map );
          }
          else {
            socket.emit( 'updatechat', {
              sender_id : chat_map.sender_id,
              msg_text  : chat_map.dest_name + ' has gone offline.'
            });
          }
        });
        // End /updatechat/ message handler

        // Begin disconnect methods
        socket.on( 'chat-leave', function () {
          console.log(
            '** user %s logged out **', socket.user_id
          );
          signOut( io, socket.user_id );
        });

        socket.on( 'disconnect', function () {
          console.log(
            '** user %s closed browser window or tab **',
            socket.user_id
          );
          // signOut( io, socket.user_id );
        });
        // End disconnect methods

      }
    );
    // End of connect
  }
};

module.exports = chatObj;
// ----------------- END PUBLIC METHODS -------------------
