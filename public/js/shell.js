/*
 * mdhChat.js
 * Shell module
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global $, mdhChat */

mdhChat.shell = (function () {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var
    moduleName = '[shell] ',
    configMap = {
      sign_up_confirm_html: [
        '<div id="sign-up-popup" data-role="popup" data-dimissable="no" class="ui-content">',
        '<div class="chat-shell-popup-msg">',
        '<p>Successfully signed up as:<br><br> USER USERNAME<br>EMAIL EMAIL-ADDR</p>',
        '<p>Thanks for signing up to myChat!</p>',
        '<a href="#sign-in" data-role="none">Dismiss</a>',
        '</div>',
        '</div>'
      ],

      sign_up_fail_html: [
        '<div id="sign-up-popup-fail" data-role="popup" data-dimissable="yes" class="ui-content">',
        '<div class="chat-shell-popup-msg-fail">',
        '<p>User name ** USERNAME ** already in use.<br> Please sign up with a different user name.</p>',
        '<a href="#sign-up" data-role="none">Dismiss</a>',
        '</div>',
        '</div>'
      ],

      sign_up_invalid_html: [
        '<div id="sign-up-invalid" data-role="popup" data-dimissable="yes" class="ui-content">',
        '<div class="chat-shell-popup-msg-fail">',
        '<p>Sign up failed.</p>',
        '<p>User name and password must be at least 4 characters long.',
        '<br>Email address must be of the form: user_id@domain.com',
        '<br>(example: bigpapa@google.com)</p>',
        '<p>Please try again.</p>',
        '<a href="#sign-up" data-role="none">Dismiss</a>',
        '</div>',
        '</div>'
      ],

      sign_up_passwd_err_html: [
        '<div id="sign-up-passwd-err" data-role="popup" data-dimissable="yes" class="ui-content">',
        '<div class="chat-shell-popup-msg-fail">',
        '<p>Sign up failed.<br>',
        'Passwords entered do not match.<br>',
        'Please try again.</p>',
        '<a href="#sign-up" data-role="none">Dismiss</a>',
        '</div>',
        '</div>'
      ],

      sign_in_fail_html: [
        '<div id="sign-in-popup-fail" data-role="popup" data-dimissable="yes" class="ui-content">',
        '<div class="chat-shell-popup-msg-fail">',
        '<p>Sign in failed.<br> Please check user name and password are correct and try again.</p>',
        '<a href="#sign-in" data-role="none">Dismiss</a>',
        '</div>',
        '</div>'
      ]
    },
    stateMap  = { $container : null },
    jqueryMap = {},
    setJqueryMap, configModule, initModule,

    onSignIn, onSignInFail, onSignUp, onSignOut,
    onSignUpFail,  onFormSubmit, signOutClick,
    signUpInvalid, signUpPasswdErr;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  // example : getTrimmedString
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  // Begin DOM method /setJqueryMap/
  setJqueryMap = function () {
    // Note: $container maybe an empty object
    var
      $container = stateMap.$container,
      $home_page = $('#home-page'),
      $sign_up_page = $('#sign-up'),
      $sign_in_page = $('#sign-in'),
      $sign_out_page =  $('#sign-out'),
      $chat_page = $('#chat-page');

    jqueryMap = {
      $container : $container,
      $home_page : $home_page,
      $sign_up_page: $sign_up_page,
      $sign_up_form : $sign_up_page.find('form'),
      $sign_up_form_reset : $sign_up_page.find('input[type="reset"]'),
      $sign_in_page : $sign_in_page,
      $sign_in_form : $sign_in_page.find('form'),
      $sign_in_form_reset : $sign_in_page.find('input[type="reset"]'),
      $sign_out_page : $sign_out_page,
      $sign_out_button : $sign_out_page.find('button'),
      $chat_page : $chat_page
    };
  };
  // End DOM method /setJqueryMap/
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------

  // user signed in ok
  // redirect user to chat page
  onSignIn = function(event, user_map) {
    console.log(moduleName + 'onSignIn -> ', user_map);

    // $(window).bind('beforeunload', function() {
    //  return 'This action will sign you out.' ;
    // });

    $.mobile.changePage($(jqueryMap.$chat_page),
     {dataUrl: 'chat-page'});

    // set button to sign-out
    // var $btn = jqueryMap.$chat_page.find('#in-out-btn');
    // $btn.attr('href', '#sign-out');
    // $('#in-out-btn .ui-btn-text').text("Sign out");
  };

  // user signed out
  onSignOut = function(event, user_map) {
    console.log(moduleName + 'onSignOut -> ', user_map);

    // set button to sign in
    // var $btn = jqueryMap.$chat_page.find('#in-out-btn');
    // $btn.attr('href', '#sign-in');
    // $('#in-out-btn .ui-btn-text').text("Sign in");

    // $.mobile.changePage($(jqueryMap.$home_page),
    //  {dataUrl: 'chat.html'});
  };

  // user sign-in failed
  // bring up popup alerting user to this
  onSignInFail = function(event, user_map) {
    console.log(moduleName + 'onSignInFail ->', user_map);

    var page, $page, $popup;

    page = configMap.sign_in_fail_html.join('');
    $page = $(page);

    $page.appendTo($.mobile.pageContainer).trigger('create');

    $popup = $('#sign-in-popup-fail');

    $popup.popup().bind( { popupafterclose: function() {
      console.log('remove ->', this);
      $(this).remove();
    }
    });

    $popup.popup('open');

  };

  // user signed up ok
  // bring up popup with user info
  // when user dismisses popup, send user to sign in page
  onSignUp = function(event, user_map) {
    var page, $page, $popup;

    console.log(moduleName + 'onSignUp ->', user_map);

    page = configMap.sign_up_confirm_html.join('');
    $page = $(page);

    $page.html(function(index,old){
      return old
        .replace(/USERNAME/g, user_map.name)
        .replace(/EMAIL-ADDR/g,user_map.email);
    }).appendTo($.mobile.pageContainer).trigger('create');

    $popup = $('#sign-up-popup');

    $popup.popup().bind( { popupafterclose: function() {
      console.log('remove ->', this);
      $(this).remove();
    } } );

    $popup.popup('open');
  };

  // user signup failed
  // bring up popup alerting user to this
  // when popup is dismissed, clear sign-up form
  onSignUpFail = function(event, user_map) {
    console.log(moduleName + 'onSignUpFail ->', user_map);

    var page, $page, $popup;

    page = configMap.sign_up_fail_html.join('');
    $page = $(page);

    $page.html(function(index,old){
      return old
        .replace(/USERNAME/g, user_map.name);
    }).appendTo($.mobile.pageContainer).trigger('create');

    $popup = $('#sign-up-popup-fail');

    // add anchor click handler
    // don't do this for now - clearing all fields may irritate some
    // users
    /*
    $('.chat-shell-popup-msg-fail a').on('click', function(evnt) {
      console.log('in click handler');

      var $reset = jqueryMap.$sign_up_form.find('.reset-form');
      $reset.trigger('click');

      // don't prevent default behavior as we do want to follow
      // the link
    });
    */

    $popup.popup().bind( { popupafterclose: function() {
      console.log('remove ->', this);
      $(this).remove();
      }
    });

    $popup.popup('open');
  };

  // bad sign-up input
  // bring up popup alerting user to this
  signUpInvalid = function(event, user_map) {
    var page, $page, $popup;

    page = configMap.sign_up_invalid_html.join('');
    $page = $(page);

    $page.appendTo($.mobile.pageContainer).trigger('create');

    $popup = $('#sign-up-invalid');

    $popup.popup().bind( { popupafterclose: function() {
      console.log('remove ->', this);
      $(this).remove();
    }
    });

    $popup.popup('open');
  };

  // sign-up password mismatch
  // bring up popup alerting user to this
  signUpPasswdErr = function(event, user_map) {
    var page, $page, $popup;

    page = configMap.sign_up_passwd_err_html.join('');
    $page = $(page);
    $page.appendTo($.mobile.pageContainer).trigger('create');
    $popup = $('#sign-up-passwd-err');

    $popup.popup().bind( { popupafterclose: function() {
      console.log('remove ->', this);
      $(this).remove();
    }
    });

    $popup.popup('open');
  };

  // event handler for sign-in and sign-up form submission
  onFormSubmit = function(event) {
    var $this = $(this), user_map = {}, $name, $passwd, $passwd_confirm,
      $email, $form,
      name, email, passwd, passwd_confirm;

    console.log(moduleName + 'onFormSubmit -> form: ' + this.id);

    // we can do this at the beginning of the event handler
    event.preventDefault();

    $form = this.id === 'sign-in-form' ? jqueryMap.$sign_in_form :
      jqueryMap.$sign_up_form;

    // grab form data
    if (this.id === 'sign-in-form') {
      $name = $form.find('#in-user');
      $passwd = $form.find('#in-passwd');

      name = $name.val().trim();
      passwd = $passwd.val().trim();

      // real basic check before sending to server to verify
      if (name.length < 4 || passwd.length < 4) {
          onSignInFail('chat-sign-in-fail', {name: name});
        return false;
      }
      user_map.name = name;
      user_map.passwd = passwd;

      mdhChat.model.people.sign_in(user_map);

    } else {
      $name = $form.find('#up-user');
      $email = $form.find('#up-email');
      $passwd = $form.find('#up-passwd');
      $passwd_confirm = $form.find('#up-passwd-confirm');

      name = $name.val().trim();
      email = $email.val().trim();
      passwd = $passwd.val().trim();
      passwd_confirm = $passwd_confirm.val().trim();

      // real basic check before sending to server to verify
      if ( (name.length < 4) ||
          (passwd.length < 4) || !mdhChat.util.validateEmail(email) ) {
        signUpInvalid('', {name: name});
        return false;
      }

      if (passwd !== passwd_confirm) {
        signUpPasswdErr('', {name: name});
        return false;
      }

      user_map.name = name;
      user_map.email = email;
      user_map.passwd = passwd;

      mdhChat.model.people.sign_up(user_map);
    }

    return false; // for safety
  };

  // event handler for when user signs out
  // use sign_out model method to tell listeners about it
  // and  switch to home page
  signOutClick = function(evnt) {
    console.log(moduleName + 'signOutClick -> ' + this.id);
    mdhChat.model.people.sign_out();
    jqueryMap.$sign_out_page.dialog('close');
  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  // Begin public method /configModule/
  // Purpose    : Adjust configuration of allowed keys
  // Arguments  : A map of settable keys and values
  // Settings   :
  //   * configMap.settable_map declares allowed keys
  // Returns    : true
  // Throws     : none
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
  // Purpose    : Initializes module
  // Arguments  :
  //  * $container the jquery element used by this feature
  //    $container is allowed to be an empty object
  // Returns    : true
  // Throws     : none
  //
  initModule = function ( $container ) {
    var device;

    console.log(moduleName + 'initModule');

    // container may be an empty object!!
    stateMap.$container = $container;

    setJqueryMap();

    // Detect if mobile device. May not be the best way to do this
    device = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

    // configure and initialize feature modules
    // we only have one feature, chat!
    mdhChat.chat.configModule({
      chat_model      : mdhChat.model.chat,
      people_model    : mdhChat.model.people,
      mobile_device : device.test(navigator.userAgent)
    });

    mdhChat.chat.initModule( {} );

    // Configure event handling
    $.gevent.subscribe(jqueryMap.$sign_in_page, 'chat-sign-in', onSignIn);
    $.gevent.subscribe(jqueryMap.$sign_in_page, 'chat-sign-in-fail', onSignInFail);
    $.gevent.subscribe(jqueryMap.$chat_page, 'chat-sign-out', onSignOut);

    $.gevent.subscribe(jqueryMap.$sign_up_page, 'chat-sign-up', onSignUp);
    $.gevent.subscribe(jqueryMap.$sign_up_page, 'chat-sign-up-fail', onSignUpFail);

    console.log(moduleName  + 'sign_in_form -> ', jqueryMap.$sign_in_form);

    jqueryMap.$sign_in_form.on('submit', onFormSubmit);
    jqueryMap.$sign_up_form.on('submit', onFormSubmit);

    // sign out button
    jqueryMap.$sign_out_button.on("click", signOutClick);


    $(document).bind("pagechange", function(evnt, data) {
      var page;
      console.log(moduleName, "event - > ", evnt.type);

      if (data.toPage) {
        page = (typeof data.toPage === 'object')
            ? data.toPage.data('url') : data.toPage;

        console.log(moduleName + 'page:', page);

        // When forms are loaded, ensure all fields are cleared
        if (page == 'sign-in') {
          console.log(jqueryMap.$sign_in_form_reset);

          jqueryMap.$sign_in_form_reset.trigger('click');
        } else if (page == 'sign-up') {
          jqueryMap.$sign_up_form_reset.trigger('click');

        } else if (page == 'chat-page') {
          // change sign-in button to sign-out
          // var $btn = jqueryMap.$chat_page.find('#in-out-btn');
          // $btn.attr('href', '#sign-out').html('Sign out');
        }
      }

    });

    // once on chat-page and logged in, prevent from going to other pages
    // most notably back to the sign-in page!
    $(document).on("pagebeforechange", function(evnt, data) {
      var page, user;

      console.log(moduleName, "event - > ", evnt.type);
      console.log(moduleName + 'data.toPage:', data.toPage);

      user = mdhChat.model.people.get_user();
      console.log(moduleName, 'user: ', user);

      if (data.toPage) {
        page = (typeof data.toPage === 'object')
          ? data.toPage[0].id : data.toPage;

        console.log(moduleName + 'toPage:', page);
      }

      // If not signed in, allow to navigate to any page
      if (user.get_is_anon()) {
        return;
      }

      // if we're going to sign-out or settings page, allow pagechange
      if ( (page.indexOf('sign-out') >= 0)  ||
           (page.indexOf('settings') >= 0) ) {
        return;
      }

      if ( ( page.indexOf('chat-page') == -1 ) && !user.get_is_anon() ) {
        evnt.preventDefault();
        history.go(1);
      }
    });

  };
  // End public method /initModule/

  // return public methods
  return {
    configModule : configModule,
    initModule   : initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
}());
