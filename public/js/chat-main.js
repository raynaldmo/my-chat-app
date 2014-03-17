/*
 * chat-main.js
 * Chat feature module
 */

/*jslint         browser : true, continue : true,
 devel  : true, indent  : 2,    maxerr   : 50,
 newcap : true, nomen   : true, plusplus : true,
 regexp : true, sloppy  : true, vars     : false,
 white  : true
 */

/*global $, mdhChat */

mdhChat.chat = (function () {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var
    moduleName = '[chat-main] ',
    configMap = {
      settable_map : {
        chat_model      : true,
        people_model    : true
      },
      chat_model      : null,
      people_model    : null
    },

    stateMap  = {
      $container   : null
    },

    jqueryMap = {},

    setJqueryMap,  setPxSizes,   scrollChat,
    writeChat,     writeAlert,   clearChat,
    onSubmitMsg,  onTapList,
    onSetchatee,   onUpdatechat, onListchange,
    onSignIn,       onSignOut,
    configModule,  initModule,
    onLineBtnClick;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  // Begin DOM method /setJqueryMap/
  setJqueryMap = function () {
    var
      $chat_page, $msg_log, $chat_input, $panel, $settings_page;

    $chat_page = $('#chat-page');
    $msg_log = $('.chat-main-msg-log');
    $chat_input = $('.chat-main-input');
    $panel = $('#chat-user-panel');

    $settings_page = $('#settings-page');

    jqueryMap = {
      $chat_page   : $chat_page,
      $head     : $chat_page.find( '.chat-main-title' ),
      $title    : $chat_page.find( '.chat-main-title' ),

      $msg_log  : $msg_log,
      $input    : $chat_input.find( 'input[type=text]'),
      $send     : $chat_input.find( '.chat-msg-send-btn' ),

      $panel    : $panel,
      $users    : $panel.find('.chat-users'),
      $online_btn : $chat_page.find('#online-btn'),

      $settings_page : $settings_page
    };
  };
  // End DOM method /setJqueryMap/

  // Begin private DOM methods to manage chat message
  scrollChat = function() {
    var $msg_log = jqueryMap.$msg_log;
    $msg_log.animate(
      { scrollTop : $msg_log.prop( 'scrollHeight' )
        - $msg_log.height()
      },
      150
    );
  };

  writeChat = function ( person_name, text, is_user ) {
    var msg_class = is_user
      ? 'chat-msg-log-me' : 'chat-msg-log-msg';

    jqueryMap.$msg_log.append(
      '<div class="' + msg_class + '">'
        + mdhChat.util_b.encodeHtml(person_name) + ': '
        + mdhChat.util_b.encodeHtml(text) + '</div>'
    );

    scrollChat();
  };

  writeAlert = function ( alert_text ) {
    jqueryMap.$msg_log.append(
      '<div class="chat-msg-log-alert">'
        + mdhChat.util_b.encodeHtml(alert_text)
        + '</div>'
    );
    scrollChat();
  };

  clearChat = function () { jqueryMap.$msg_log.empty(); };
  // End private DOM methods to manage chat message
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------

  onSubmitMsg = function ( event ) {
    var msg_text = jqueryMap.$input.val();
    if ( msg_text.trim() === '' ) { return false; }
    configMap.chat_model.send_msg( msg_text );

    // jqueryMap.$input.focus();

    jqueryMap.$send.addClass('chat-msg-send-btn-highlight');
    setTimeout(
      function ()
        { jqueryMap.$send.removeClass('chat-msg-send-btn-highlight'); },
      500
    );

    event.preventDefault();

    return false; // to be safe
  };

  onTapList = function ( event ) {
    var $tapped  = $( event.target ), chatee_id;

    console.log(moduleName +
      'onTapList -> ', 'type:', event.type, ' target:', event.target);

    if ( ! $tapped.hasClass('chat-list-name') ) { return false; }

    chatee_id = $tapped.attr( 'data-id' );
    if ( ! chatee_id ) { return false; }

    configMap.chat_model.set_chatee( chatee_id );
    return false;
  };

  onLineBtnClick = function ( event ) {
    var user;
    user = mdhChat.model.people.get_user();
    console.log(moduleName, 'onLineBtnClick -> ', ' user:', user);

    // online button shouldn't work if user is not logged in
    if (user.get_is_anon()) {
      event.preventDefault();
      return false;
    }

    return true;
  };

  onSetchatee = function ( event, arg_map ) {
    var
      new_chatee = arg_map.new_chatee,
      old_chatee = arg_map.old_chatee;

    console.log(moduleName + 'onSetchatee -> ', event);

    if ( ! new_chatee ) {
      if ( old_chatee ) {
        writeAlert( old_chatee.name + ' has left the chat' );
      }
      else {
        writeAlert( 'Your friend has left the chat' );
      }
      // jqueryMap.$title.text( 'Chat' );
      return false;
    }

    jqueryMap.$users
      .find( '.chat-list-name' )
      .removeClass( 'chat-x-select' )
      .end()
      .find( '[data-id=' + arg_map.new_chatee.id + ']' )
      .addClass( 'chat-x-select' );

    writeAlert( 'Now chatting with ' + arg_map.new_chatee.name );
    // jqueryMap.$title.text( 'Chat with ' + arg_map.new_chatee.name );
    return true;
  };

  // sever published updated online user list, update our view
  onListchange = function ( event ) {
    var list_html, people_db, chatee, users = 0;

    console.log(moduleName + 'onListchange -> ', event);

    people_db = configMap.people_model.get_db();
    chatee    = configMap.chat_model.get_chatee();

    list_html = '<ul data-role="listview" data-theme="c" data-inset="true">';

    people_db().each( function ( person, idx ) {
      var select_class = '';

      if ( person.get_is_anon() || person.get_is_user() )
        { return true;}

      users++;

      if ( chatee && chatee.id === person.id ) {
        select_class=' chat-x-select';
      }
      list_html
        += '<li class="chat-list-name'
        +  select_class + '" data-id="' + person.id + '">'
        +  mdhChat.util_b.encodeHtml( person.name ) + '</li>';
    });

    list_html += '</ul>';

    if ( users == 0 ) {
      list_html
        += '<li class="chat-list-note">'
        + "Aw man, No one's online!"
        + '</li></ul>';
      clearChat();
    }

    var $ul = $(list_html);
    jqueryMap.$users.html($ul);

    jqueryMap.$panel.trigger('updatelayout');
    $ul.listview().listview('refresh');
  };

  onUpdatechat = function ( event, msg_map ) {
    var
      is_user,
      sender_id = msg_map.sender_id,
      msg_text  = msg_map.msg_text,
      chatee    = configMap.chat_model.get_chatee() || {},
      sender    = configMap.people_model.get_by_cid( sender_id );

    if ( ! sender ) {
      writeAlert( msg_text );
      return false;
    }

    is_user = sender.get_is_user();

    if ( ! ( is_user || sender_id === chatee.id ) ) {
      configMap.chat_model.set_chatee( sender_id );
    }

    writeChat( sender.name, msg_text, is_user );

    if ( is_user ) {
      jqueryMap.$input.val( '' );
      // jqueryMap.$input.focus();
    }
  };

  onSignIn = function ( event, user_map ) {
    console.log(moduleName, 'onSignIn -> ', ' user:', user_map.name);

    // set user name
    jqueryMap.$title.text(user_map.name);

    // set button to sign-out
    var $btn = jqueryMap.$chat_page.find('#in-out-btn');
    $btn.attr('href', '#sign-out');
    $('#in-out-btn .ui-btn-text').text("Sign out");
  };

  onSignOut = function ( event, user_map ) {

    jqueryMap.$title.text('myChat');

    // set button to sign in
    var $btn = jqueryMap.$chat_page.find('#in-out-btn');
    $btn.attr('href', '#sign-in');
    $('#in-out-btn .ui-btn-text').text("Sign in");

    clearChat();
  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  // Begin public method /configModule/
  // Purpose   : Configure the module prior to initialization
  // Arguments :
  //   * chat_model - the chat model object provides methods
  //       to interact with our instant messaging
  //   * people_model - the people model object which provides
  //       methods to manage the list of people the model maintains
  // Action    :
  //   The internal configuration data structure (configMap) is
  //   updated with provided arguments. No other actions are taken.
  // Returns   : true
  // Throws    : JavaScript error object and stack trace on
  //             unacceptable or missing arguments
  //
  configModule = function ( input_map ) {
    mdhChat.util.setConfigMap({
      input_map    : input_map,
      settable_map : configMap.settable_map,
      config_map   : configMap
    });
    return true;
  };
  // End public method /configModule/

  // Begin public method /initModule/
  // Example    : spa.chat.initModule( $('#div_id') );
  // Purpose    :
  //   Directs Chat to offer its capability to the user
  // Arguments  :
  //   * $append_target (example: $('#div_id')).
  //     A jQuery collection that should represent
  //     a single DOM container
  // Action     :
  //   Appends the chat slider to the provided container and fills
  //   it with HTML content.  It then initializes elements,
  //   events, and handlers to provide the user with a chat-room
  //   interface
  // Returns    : true on success, false on failure
  // Throws     : none
  //
  initModule = function ( $container ) {
    console.log(moduleName + 'initModule');

    stateMap.$container = $container;
    setJqueryMap();

    // subscribe to jQuery global events
    var $page = jqueryMap.$chat_page;

    $.gevent.subscribe( $page, 'chat-list-change', onListchange );
    $.gevent.subscribe( $page, 'chat-update-chat', onUpdatechat );
    $.gevent.subscribe( $page, 'chat-sign-in',     onSignIn      );
    $.gevent.subscribe( $page, 'chat-sign-out',    onSignOut     );
    $.gevent.subscribe( jqueryMap.$users, 'chat-set-chatee',  onSetchatee  );

    // bind user input events
    jqueryMap.$users.bind('tap click', onTapList   );
    jqueryMap.$send.bind('tap click', onSubmitMsg );
    // jqueryMap.$form.bind(   'submit', onSubmitMsg );
    jqueryMap.$online_btn.bind('tap click', onLineBtnClick);

    /*
    jqueryMap.$msg_log.bind('tap', function() {
      var $footer = $('#footer');
      var visibility = $footer.css('visibility');
      if (visibility == 'hidden') {
        $footer.css('visibility', 'visible');
      } else {
        $footer.css('visibility', 'hidden');
      }
    });
    */



  };
  // End public method /initModule/

  // return public methods
  return {
    configModule      : configModule,
    initModule        : initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
}());
