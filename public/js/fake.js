/*
 * fake.js
 * Fake module
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global $, mdhChat */

mdhChat.fake = (function () {
  'use strict';
  var moduleName = '[fake] ',
    peopleList, fakeIdSerial, makeFakeId, mockSio;

  fakeIdSerial = 5;

  makeFakeId = function () {
    return 'id_' + String( fakeIdSerial++ );
  };

  peopleList = [
    { name : 'Fred', _id : 'id_01',
      email: 'fred@test.com',
      passwd: 'fred'
    },
    { name : 'Wilma', _id : 'id_02',
      email: 'wilma@test.com',
      passwd: 'wilma'
    },
    { name : 'Barney', _id : 'id_03',
      email: 'barney@test.com',
      passwd: 'barney'
    },
    { name : 'Betty', _id : 'id_04',
      email: 'betty@test.com',
      passwd: 'betty'
    }
  ];

  mockSio = (function () {
    var
      on_sio, emit_sio, emit_mock_msg,
      send_listchange, listchange_idto,
      callback_map = {};

    on_sio = function ( msg_type, callback ) {
      // get rid of '-' in message name so I can
      // easily use as callback_map property
      msg_type = msg_type.replace(/-/g, '');

      callback_map[ msg_type] = callback;
    };

    emit_sio = function ( msg_type, data ) {
      var person_map, i;
      console.log(moduleName, 'emit_sio -> ', msg_type);

      // Respond to 'sign-up-user' event with 'sign-up-success'
      // callback after a 3s delay.
      if ( msg_type === 'sign-up-user' && callback_map.signupsuccess ) {
        setTimeout( function () {
          person_map = {
            cid     : data.cid,
            name    : data.name,
            email   : data.email,
            passwd : data.passwd
          };
          callback_map.signupsuccess([ person_map ]);
        }, 3000 );
      }

      // Respond to 'sign-in-user' event with 'sign-in-success'
      // callback after a 3s delay.
      if ( msg_type === 'sign-in-user' && callback_map.signinsuccess ) {
        setTimeout( function () {
          person_map = {
            cid     : data.cid,
            name    : data.name,
            passwd : data.passwd
          };
          peopleList.push( person_map );
          callback_map.signinsuccess([ person_map ]);
        }, 3000 );
      }

      // Respond to 'updatechat' event with an 'updatechat'
      // callback after a 2s delay. Echo back user info.
      if ( msg_type === 'updatechat' && callback_map.updatechat ) {
        setTimeout( function () {
          var user = mdhChat.model.people.get_user();
          callback_map.updatechat([{
            dest_id   : user.id,
            dest_name : user.name,
            sender_id : data.dest_id,
            msg_text  : 'Thanks for the note, ' + user.name
          }]);
        }, 2000);
      }

      if ( msg_type === 'leavechat' ) {
        // reset login status
        delete callback_map.listchange;
        delete callback_map.updatechat;

        if ( listchange_idto ) {
          clearTimeout( listchange_idto );
          listchange_idto = undefined;
        }
        send_listchange();
      }

    };

    emit_mock_msg = function () {
      setTimeout( function () {
        var user = mdhChat.model.people.get_user();
        if ( callback_map.updatechat ) {
          callback_map.updatechat([{
            dest_id   : user.id,
            dest_name : user.name,
            sender_id : 'id_05',
            msg_text  : 'Hi there ' + user.name + '!  Fred here.'
          }]);
        }
        else { emit_mock_msg(); }
      }, 8000 );
    };

    // Try once per second to use listchange callback.
    // Stop trying after first success.
    // listchange callback is triggered like so:

    // model:signInSuccess -> chat.join() -> sio.on( 'listchange',...)
    send_listchange = function () {
      listchange_idto = setTimeout( function () {
        if ( callback_map.listchange ) {
          callback_map.listchange([ peopleList ]);
          emit_mock_msg();
          listchange_idto = undefined;
        }
        else { send_listchange(); }
      }, 1000 );
    };

    // We have to start the process ...
    send_listchange();

    return { emit : emit_sio, on : on_sio };
  }());

  return { mockSio : mockSio };
}());
