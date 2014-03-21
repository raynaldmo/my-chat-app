// admin.js
var
  logIn,
  crud    = require('./crud'),
  bcrypt  = require('bcrypt');

// admin login successful
logIn = function( username, req, res ) {
  req.session.user = {"name" : username};
  req.session.loggedIn = true;

  console.log('logged in user -> ', req.session.user);
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

// POST /login - process user login page
exports.doLogin = function(req, res) {
  // body object is provided by bodyParser()!
  console.log('POST /login: body ->', req.body, 'query ->', req.query);

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
