// admin-srv.js
var
  logIn, signUpUser, createUser, signInUser, signIn, signOutUser,
  crud        = require('./crud'),
  chat        = require('./chat'),
  makeMongoId = crud.makeMongoId,
  bcrypt      = require('bcrypt'),
  assert      = require('assert');

// admin login successful
logIn = function( username, req, res ) {
  req.session.user = {"name" : username};
  req.session.loggedIn = true;
  res.redirect('/admin');
};

// GET /admin - get logged in admin page
exports.index = function(req, res) {
  console.log('cookies: ', req.cookies);
  console.log('signed cookies: ', req.signedCookies);
  console.log('cookie.maxAge: ', req.session.cookie.maxAge);
  console.log('cookie.expires: ', req.session.cookie.expires);

  if (req.session.loggedIn === true) {
    console.log('found session -> ', req.session.user);
    res.render('admin-page', {title: 'myChat Admin'});

  } else {
    console.log("no session or session expired");
    res.redirect('/login');
  }
};

// GET /admin/users - get user information
// request comes from ajax call
exports.users = function(req, res) {

  if (req.session.loggedIn === true) {
    // get all user info
    var
      option_map = {
        fields: {
          _id:1, name:1, email:1, is_online:1, signed_up:1, last_sign_in:1
        }
      };
    crud.read(
      'user',
      {}, // get all users
      option_map,
      function (result_list) {
        console.log("All Users -> ", result_list);
        // user with that name already exists
        if ( result_list.length > 0 ) {
          res.json(result_list);
        } else {
          res.json({"status": "info", "msg": "No users in database"});
        }
      }
    );
  } else {
    console.log("no session or session expired");
    res.redirect('/login');
  }
};

// POST /admin/users/delete - delete user(s)
// request comes from ajax call
exports.doDelete = function(req, res) {

  if (req.session.loggedIn === true) {
    var user_id_map, id;
    console.log('POST /users/delete: body ->', req.body, 'query ->', req.query);

    user_id_map = req.body;

    // iterate through user_id_map and perform action
    // at this point only one action is supported - delete
    for (var key in user_id_map) {
      if (user_id_map.hasOwnProperty(key)) {
        id = makeMongoId(user_id_map[key]);
        assert.equal(24, id.toHexString().length);

        crud.destroy(
          'user',
          {_id: id},
          function (err, deleted_count) {
            if (err) throw err;
            console.log("deleted: ", deleted_count, "documents");
            res.json({"status": "info", "msg": "action performed"});
        });
      }
    }
  } else {
    console.log("no session or session expired");
    res.redirect('/login');
  }
};

// add user to database
createUser = function (req, res) {
  var user_map = req.body;
  user_map.is_online = false;

  bcrypt.genSalt(10, function(err, salt) {
    if (err) {
      res.send(500);
    } else {
      bcrypt.hash(user_map.passwd, salt, function(err, hash) {
        if (err) {
          res.send(500);
        } else {
          user_map.passwd = hash;
          delete user_map.cid; // we don't store the client id
          user_map.signed_up = (new Date()).toLocaleDateString();
          user_map.last_sign_in = 'Never';

          crud.construct(
            'user',
            user_map,
            function (result_list) { // hope there wasn't an error!
              res.send(200);
            }
          );
        }
      });
    }
  });
};

// sign-up a user
signUpUser = function(req, res) {
  // make sure the required fields are at least there, though
  // their values maybe invalid.
  // We don't care about rigorous checking at this point
  if (req.body.name && req.body.email && req.body.passwd) {

    crud.read(
      'user', // guaranteed to pass checkType() check !
      { name : req.body.name }, // find user by name
      {}, // options
      function ( result_list ) {
        if ( result_list.length > 0 ) {
          // user with that name already exists
          res.send(400); // return 'client error'
        }
        // create new user
        else {
          createUser(req, res);
        }
      }
    );
  } else {
    res.send(400);
  }
};

signIn = function(req, res, user_map) {
  var io = chat.get_io().io;

  if (!io) {
    console.log('null io');
    return res.send(500);
  }

  crud.update(
    'user',
    { '_id'         : user_map._id },
    { is_online     : true,
      last_sign_in  : (new Date()).toLocaleString()
    },

    function (result_map) {
      // tell all clients about sign-in
      crud.read(
        'user',
        { is_online : true },
        {},
        function ( result_list ) { // result_list will contain all online users!
          // TBD - delete hashed passwords from result_list!
          // console.log("[emitUserList] -> ", result_list);
          io.of('/chat').emit( 'listchange', result_list );
          res.send(200);
        }
      );
    }
  );
};

signInUser = function(req, res) {
  if (req.body.name && req.body.passwd) {
    // Find user by name
    crud.read(
      'user',
      { name : req.body.name },
      {},
      function ( result_list ) {
        var result_map;
        if ( result_list.length > 0 ) {
          result_map     = result_list[ 0 ];
          // check password
          bcrypt.compare(req.body.passwd, result_map.passwd, function(err, status) {
            if (err) {
              return res.send(400);
            } else {
              if (status == true) {
                signIn(req, res, result_map);
              } else {
                return res.send(400);
              }
            }
          });
        } else {
          // no user by that name!
          return res.send(400);
        }
      }
    );
  } else {
    res.send(400);
  }

};

signOutUser = function(req, res) {
  var io;

  if (req.body.name) {
    io = chat.get_io().io;

    if (!io) {
      console.log('null io');
      return res.send(500);
    }

    crud.update(
      'user',
      { 'name'     : req.body.name },
      { is_online : false   },

      function (result_list) {
        // tell all clients about sign-out
        crud.read(
          'user',
          { is_online : true },
          {},
          function (result_list) { // result_list will contain all online users!
            io.of('/chat').emit( 'listchange', result_list );
            res.send(200);
          }
        );
      }
    );
  } else {
    res.send(400);
  }
};

// POST /admin/users/:action - sign/up/in/out user(s)
// currently comes from external script
exports.doAction = function(req, res) {

  if (req.session.loggedIn === true) {

    console.log('POST /users/:action url ->', req.url, ' body -> ', req.body,
      'query ->', req.query, ' param -> ', req.params.action);

    if (req.params && req.params.action) {
      switch (req.params.action) {
        case 'sign-up':
          signUpUser(req, res);
          break;
        case 'sign-in':
          signInUser(req, res);
          break;
        case 'sign-out':
          signOutUser(req, res);
          break;
        default:
          console.log('doAction -> unknown action ', req.params.action);
          res.send(400);
          break;
      }
    }

  } else {
    console.log("no session or session expired");
    res.redirect('/login');
  }
};

// GET /login - get user login page
exports.login = function (req, res) {
  console.log('GET /login: body ->', req.body, 'query ->', req.query);

  // check for errors
  var arrErrors = [];
  if (req.query) {
    if (req.query.error === 'login') {
      arrErrors.push('Login failed');
    }
  }

  res.render('login-form', {
    title: 'Login',
    errors: arrErrors
  });
};

// POST /login - process admin user login page
exports.doLogin = function(req, res) {
  // body object is provided by bodyParser()!
  console.log('POST /login: body ->', req.body, 'query ->', req.query);

  if (req.session && req.session.loggedIn === true) {
    return res.send(200);
  }

  if (req.body.username) {

    var user_map = {name: req.body.username, passwd: req.body.passwd};
    crud.read(
      'admin', // collection name
      { name : user_map.name },
      {},
      function ( result_list ) {
        var result_map;

        if ( result_list.length > 0 ) {
          result_map     = result_list[0];
          // check password
          bcrypt.compare(user_map.passwd, result_map.passwd, function(err, result) {
            if (err) {
              res.redirect('/login?error=login');
            } else {
              if (result == true) {
                logIn(user_map.name, req, res);
              } else {
                res.redirect('/login?error=login');
              }
            }
          });
        } else {
          // no user by that name!
          res.redirect('/login?error=login');
        }
      }
    );
  } else {
    res.redirect('/login?error=login');
  }
};

function clearSession(session, fn) {
  session.destroy();
  fn();
}

// GET /logout - logout user
exports.doLogout = function(req, res) {
  console.log('GET /logout: body ->', req.body, 'query ->', req.query);
  clearSession(req.session, function() {
    res.redirect('/login');
  });
};
