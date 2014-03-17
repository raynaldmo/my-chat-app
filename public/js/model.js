/*
 * model.js
 * Model module
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global TAFFY, $, mdhChat */

mdhChat.model = (function () {
  'use strict';
  var
    moduleName = '[model] ',
    configMap = { anon_id : 'a0' },
    stateMap  = {
      anon_user      : null,
      cid_serial     : 0,
      is_connected   : false,
      people_cid_map : {},
      people_db      : TAFFY(),
      user           : null
    },

    isFakeData = false,

    personProto, makeCid, clearPeopleDb,
    signUpSuccess, signUpFail, signInSuccess, signInFail,
    makePerson, removePerson, people, chat, initModule;

  // The people object API
  // ---------------------
  // The people object is available at spa.model.people.
  // The people object provides methods and events to manage
  // a collection of person objects. Its public methods include:
  //   * get_user() - return the current user person object.
  //     If the current user is not signed-in, an anonymous person
  //     object is returned.
  //   * get_db() - return the TaffyDB database of all the person
  //     objects - including the current user - presorted.
  //   * get_by_cid( <client_id> ) - return a person object with
  //     provided unique id.
  //   * sign_in( <user_map> ) - sign in as the user with the provided
  //     user name. The current user object is changed to reflect
  //     the new identity. Successful completion of login
  //     publishes a 'chat-sign-in' global custom event.
  //   * sign_up( <user_map> ) - sign up as the user with the provided
  //     user name. The current user object is changed to reflect
  //     the new identity. Successful completion of login
  //     publishes a 'chat-sign-up' global custom event.
  //   * sign_out()- revert the current user object to anonymous.
  //     This method publishes a 'chat-sign-out' global custom event.
  //
  // jQuery global custom events published by the object include:
  //   * chat-sign-in - This is published when a user sign-in process
  //     completes. The updated user object is provided as data.
  //   * chat-sign-up - This is published when a user sign-up process
  //     completes. The updated user object is provided as data.
  //   * spa-sign-out - This is published when a sign-out completes.
  //     The former user object is provided as data.
  //
  // Each person is represented by a person object.
  // Person objects provide the following methods:
  //   * get_is_user() - return true if object is the current user
  //   * get_is_anon() - return true if object is anonymous
  //
  // The attributes for a person object include:
  //   * cid - string client id. This is always defined, and
  //     is only different from the id attribute
  //     if the client data is not synced with the backend.
  //   * id - the unique id. This may be undefined if the
  //     object is not synced with the backend.
  //   * name - the string name of the user.
  //
  personProto = {
    get_is_user : function () {
      return this.cid === stateMap.user.cid;
    },
    get_is_anon : function () {
      return this.cid === stateMap.anon_user.cid;
    }
  };

  makeCid = function () {
    return 'c' + String( stateMap.cid_serial++ );
  };

  clearPeopleDb = function () {
    var user = stateMap.user;
    stateMap.people_db      = TAFFY();
    stateMap.people_cid_map = {};
    if ( user ) {
      stateMap.people_db.insert( user );
      stateMap.people_cid_map[ user.cid ] = user;
    }
  };

  // user is authenticated, create person object for user
  // and insert into local database

  signInSuccess = function ( user_list ) {
    var user_map = user_list[ 0 ];
    console.log(moduleName, 'signInSuccess -> ', user_map);

    stateMap.user = makePerson(user_map);

    // get rid of any existing old user
    delete stateMap.people_cid_map[ user_map.cid ];

    stateMap.user.cid     = user_map._id;
    stateMap.user.id      = user_map._id;

    stateMap.people_cid_map[ user_map._id ] = stateMap.user;
    chat.join();

    $.gevent.publish( 'chat-sign-in', [ stateMap.user ] );
  };

  signInFail = function ( user_list ) {
    var user_map = user_list[ 0 ];

    console.log(moduleName, 'signUpSuccess -> ', user_map);

    $.gevent.publish( 'chat-sign-in-fail', [ user_map ] );
  };

  signUpSuccess = function ( user_list ) {
    var user_map = user_list[ 0 ];

    console.log(moduleName, 'signUpSuccess -> ', user_map);

    $.gevent.publish( 'chat-sign-up', [ user_map ] );
  };

  signUpFail = function ( user_list ) {
    var user_map = user_list[ 0 ];

    console.log(moduleName, 'signUpFail -> ', user_map);

    $.gevent.publish( 'chat-sign-up-fail', [ user_map ] );
  };

  makePerson = function ( person_map ) {
    var person,
      cid     = person_map.cid,
      id      = person_map.id,
      name    = person_map.name;

    if ( cid === undefined || ! name ) {
      throw 'client id and name required';
    }

    person         = Object.create( personProto );
    person.cid     = cid;
    person.name    = name;

    if ( id ) { person.id = id; }

    stateMap.people_cid_map[ cid ] = person;

    stateMap.people_db.insert( person );
    return person;
  };

  removePerson = function ( person ) {
    if ( ! person ) { return false; }
    // cannot remove anonymous person
    if ( person.id === configMap.anon_id ) {
      return false;
    }

    stateMap.people_db({ cid : person.cid }).remove();
    if ( person.cid ) {
      delete stateMap.people_cid_map[ person.cid ];
    }
    return true;
  };

  people = (function () {
    var get_by_cid, get_db, get_user, sign_in, sign_up, sign_out;

    get_by_cid = function ( cid ) {
      return stateMap.people_cid_map[ cid ];
    };

    get_db = function () { return stateMap.people_db; };

    get_user = function () { return stateMap.user; };

    sign_in = function ( user_map ) {
      var sio = isFakeData ? mdhChat.fake.mockSio : mdhChat.data.getSio();

      sio.emit( 'sign-in-user', {
        cid     : makeCid(),
        name    : user_map.name,
        passwd  : user_map.passwd
      });
    };

    sign_up = function ( user_map ) {
      var sio = isFakeData ? mdhChat.fake.mockSio : mdhChat.data.getSio();

      sio.emit( 'sign-up-user', {
        cid     : makeCid(),
        name    : user_map.name,
        passwd  : user_map.passwd,
        email   : user_map.email
      });
    };

    sign_out = function () {
      var user = stateMap.user;

      chat._leave();
      stateMap.user = stateMap.anon_user;
      clearPeopleDb();

      $.gevent.publish( 'chat-sign-out', [ user ] );
    };

    return {
      get_by_cid : get_by_cid,
      get_db     : get_db,
      get_user   : get_user,
      sign_up    : sign_up,
      sign_in    : sign_in,
      sign_out   : sign_out
    };
  }());

  // The chat object API
  // -------------------
  // The chat object is available at spa.model.chat.
  // The chat object provides methods and events to manage
  // chat messaging. Its public methods include:
  //  * join() - joins the chat room. This routine sets up
  //    the chat protocol with the backend including publishers
  //    for 'spa-listchange' and 'spa-updatechat' global
  //    custom events. If the current user is anonymous,
  //    join() aborts and returns false.
  //  * get_chatee() - return the person object with whom the user
  //    is chatting with. If there is no chatee, null is returned.
  //  * set_chatee( <person_id> ) - set the chatee to the person
  //    identified by person_id. If the person_id does not exist
  //    in the people list, the chatee is set to null. If the
  //    person requested is already the chatee, it returns false.
  //    It publishes a 'spa-setchatee' global custom event.
  //  * send_msg( <msg_text> ) - send a message to the chatee.
  //    It publishes a 'spa-updatechat' global custom event.
  //    If the user is anonymous or the chatee is null, it
  //    aborts and returns false.
  //
  // jQuery global custom events published by the object include:
  //  * spa-setchatee - This is published when a new chatee is
  //    set. A map of the form:
  //      { old_chatee : <old_chatee_person_object>,
  //        new_chatee : <new_chatee_person_object>
  //      }
  //    is provided as data.
  //  * spa-listchange - This is published when the list of
  //    online people changes in length (i.e. when a person
  //    joins or leaves a chat) or when their contents change
  //    (i.e. when a person's avatar details change).
  //    A subscriber to this event should get the people_db
  //    from the people model for the updated data.
  //  * spa-updatechat - This is published when a new message
  //    is received or sent. A map of the form:
  //      { dest_id   : <chatee_id>,
  //        dest_name : <chatee_name>,
  //        sender_id : <sender_id>,
  //        msg_text  : <message_content>
  //      }
  //    is provided as data.
  //
  chat = (function () {
    var
      _publish_listchange, _publish_updatechat,
      _update_list, _leave_chat,

      get_chatee, join_chat, send_msg,
      set_chatee, chatee = null;

    // update our local database with online users
    _update_list = function( arg_list ) {
      var i, person_map, make_person_map, person,
        people_list      = arg_list[ 0 ],
        is_chatee_online = false;

      clearPeopleDb();

      PERSON:
      for ( i = 0; i < people_list.length; i++ ) {
        person_map = people_list[ i ];

        if ( ! person_map.name ) { continue PERSON; }

        // if user defined, update css_map and skip remainder
        if ( stateMap.user && stateMap.user.id === person_map._id ) {
          continue PERSON;
        }

        make_person_map = {
          cid     : person_map._id,
          id      : person_map._id,
          name    : person_map.name
        };
        person = makePerson( make_person_map );

        if ( chatee && chatee.id === make_person_map.id ) {
          is_chatee_online = true;
          chatee = person;
        }
      }

      stateMap.people_db.sort( 'name' );

      // If chatee is no longer online, we unset the chatee
      // which triggers the 'spa-setchatee' global event
      if ( chatee && ! is_chatee_online ) { set_chatee(''); }
    };

    // callback for online user list changes
    _publish_listchange = function ( arg_list ) {
      console.log(moduleName, '_publish_listchange -> ', arg_list);

      // update our local on-line user database
      _update_list( arg_list );

      // tell our chat page view about the change
      $.gevent.publish( 'chat-list-change', [ arg_list ] );
    };

    _publish_updatechat = function ( arg_list ) {
      var msg_map = arg_list[ 0 ];

      if ( ! chatee ) { set_chatee( msg_map.sender_id ); }
      else if ( msg_map.sender_id !== stateMap.user.id
        && msg_map.sender_id !== chatee.id
      ) { set_chatee( msg_map.sender_id ); }

      $.gevent.publish( 'chat-update-chat', [ msg_map ] );
    };
    // End internal methods

    _leave_chat = function () {
      var sio = isFakeData ? mdhChat.fake.mockSio : mdhChat.data.getSio();
      chatee  = null;
      stateMap.is_connected = false;
      if ( sio ) { sio.emit( 'chat-leave' ); }
    };

    get_chatee = function () { return chatee; };

    join_chat  = function () {
      var sio;

      if ( stateMap.is_connected ) { return false; }

      if ( stateMap.user.get_is_anon() ) {
        console.warn( 'User must be defined before joining chat');
        return false;
      }

      sio = isFakeData ? mdhChat.fake.mockSio : mdhChat.data.getSio();

      // subscribe to these events from server
      // listen for changes in online users
      sio.on( 'listchange', _publish_listchange );

      // listen for chat messages
      sio.on( 'updatechat', _publish_updatechat );

      stateMap.is_connected = true;

      return true;
    };

    send_msg = function ( msg_text ) {
      var msg_map,
        sio = isFakeData ? spa.fake.mockSio : mdhChat.data.getSio();

      if ( ! sio ) { return false; }
      if ( ! ( stateMap.user && chatee ) ) { return false; }

      msg_map = {
        dest_id   : chatee.id,
        dest_name : chatee.name,
        sender_id : stateMap.user.id,
        msg_text  : msg_text
      };

      // we published updatechat so we can show our outgoing messages
      _publish_updatechat( [ msg_map ] );
      sio.emit( 'updatechat', msg_map );
      return true;
    };

    set_chatee = function ( person_id ) {
      var new_chatee;
      new_chatee  = stateMap.people_cid_map[ person_id ];
      if ( new_chatee ) {
        if ( chatee && chatee.id === new_chatee.id ) {
          return false;
        }
      }
      else {
        new_chatee = null;
      }

      $.gevent.publish( 'chat-set-chatee',
        { old_chatee : chatee, new_chatee : new_chatee }
      );
      chatee = new_chatee;
      return true;
    };

    return {
      _leave        : _leave_chat,
      get_chatee    : get_chatee,
      join          : join_chat,
      send_msg      : send_msg,
      set_chatee    : set_chatee
    };
  }());

  initModule = function () {
    console.log(moduleName + 'initModule');

    // initialize anonymous person
    stateMap.anon_user = makePerson({
      cid   : configMap.anon_id,
      id    : configMap.anon_id,
      name  : 'anonymous'
    });
    stateMap.user = stateMap.anon_user;

    // init socket IO
    var sio = isFakeData ? mdhChat.fake.mockSio : mdhChat.data.getSio();

    sio.on( 'sign-up-fail', signUpFail );
    sio.on( 'sign-up-success', signUpSuccess );
    sio.on( 'sign-in-success', signInSuccess);
    sio.on( 'sign-in-fail', signInFail);

  };

  return {
    initModule : initModule,
    chat       : chat,
    people     : people
  };
}());
