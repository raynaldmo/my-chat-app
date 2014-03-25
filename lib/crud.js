/*
 * crud.js - module to provide CRUD db capabilities
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
  loadSchema,   checkSchema,  clearIsOnline,
  checkType,    constructObj, readObj,
  updateObj,    destroyObj, checkAdminAccnt,
  createAdminAccnt,

  mongodb     = require( 'mongodb' ),
  fsHandle    = require( 'fs'      ),
  JSV         = require( 'JSV'     ).JSV,
  bcrypt      = require( 'bcrypt'    ),

  mongoServer = new mongodb.Server(
    '192.168.0.252',
    mongodb.Connection.DEFAULT_PORT
  ),
  dbHandle    = new mongodb.Db(
    'mdh-chat', mongoServer, { safe : true }
  ),
  validator   = JSV.createEnvironment(),

  objTypeMap  = { 'user' : {}, 'admin' : {} };
// ------------- END MODULE SCOPE VARIABLES ---------------

// ---------------- BEGIN UTILITY METHODS -----------------
loadSchema = function ( schema_name, schema_path ) {
  fsHandle.readFile( schema_path, 'utf8', function ( err, data ) {
    objTypeMap[ schema_name ] = JSON.parse( data );
  });
};

checkSchema = function ( obj_type, obj_map, callback ) {
  var
    schema_map = objTypeMap[ obj_type ],
    report_map = validator.validate( obj_map, schema_map );

  callback( report_map.errors );
};

clearIsOnline = function () {
  updateObj(
    'user',
    { is_online : true  },
    { is_online : false },
    function ( response_map ) {
      console.log( 'All users set to offline', response_map );
    }
  );
};

// check if admin account exists, if not create it
createAdminAccnt = function(collection) {
  var user_map = {name: 'test', passwd: 'test'};

  bcrypt.genSalt(10, function(err, salt) {
    console.log('admin -> ', ' typeof salt:', typeof salt,
      ' salt:', salt, ' err:', err);
    if (err) {
      console.log('admin -> bcrypt.genSalt failed');
    } else {
      bcrypt.hash(user_map.passwd, salt, function(err, hash) {
        console.log('admin ->', ' typeof hash:', typeof hash,
          ' hash:', hash, ' err:', err);
        if (err) {
          console.log('admin -> bcrypt.hash failed');
        } else {
          user_map.passwd = hash;
          collection.insert(user_map, {w:1}, function(err, result) {
            if (!err) {
              console.log('created admin account ->', result);
            }
          });
        }
      });
    }
  });
};

// check if admin account exists, if not create one in separate
// collection
checkAdminAccnt = function() {

  dbHandle.collection('admin', {strict:true}, function(err, collection){
    if (err) {
      console.log('no admin table - create one');
      // create it and add authorized user(s)
      dbHandle.createCollection('admin', function(err, collection) {
        if (err) throw err;
        createAdminAccnt(collection);
      });
    }
  });
};

// ----------------- END UTILITY METHODS ------------------

// ---------------- BEGIN PUBLIC METHODS ------------------
checkType = function ( obj_type ) {
  if ( ! objTypeMap[ obj_type ] ) {
    return ({ error_msg : 'Object type "' + obj_type
      + '" is not supported.'
    });
  }
  return null;
};

// No validation for now
/*
constructObj = function ( obj_type, obj_map, callback ) {
  var type_check_map = checkType( obj_type );
  if ( type_check_map ) {
    callback( type_check_map );
    return;
  }

  checkSchema(
    obj_type, obj_map,
    function ( error_list ) {
      if ( error_list.length === 0 ) {
        dbHandle.collection(
          obj_type,
          function ( outer_error, collection ) {
            var options_map = { safe: true };

            collection.insert(
              obj_map,
              options_map,
              function ( inner_error, result_map ) {
                callback( result_map );
              }
            );
          }
        );
      }
      else {
        callback({
          error_msg  : 'Input document not valid',
          error_list : error_list
        });
      }
    }
  );
};
*/
constructObj = function ( obj_type, obj_map, callback ) {
  var type_check_map = checkType( obj_type );
  if ( type_check_map ) {
    callback( type_check_map );
    return;
  }

  dbHandle.collection( obj_type, function(outer_error, collection) {
    // retrieved collection
    // how come we don't check outer_error ?
    var options_map = { safe: true };
    collection.insert(
      obj_map,
      options_map,
      function ( inner_error, result_map ) {
        // how come we don't check inner_error
        callback( result_map );
      });
    });
};

readObj = function ( obj_type, find_map, fields_map, callback ) {
  var type_check_map = checkType( obj_type );
  if ( type_check_map ) {
    callback( type_check_map );
    return;
  }

  dbHandle.collection(
    obj_type,
    function ( outer_error, collection ) {
      collection.find( find_map, fields_map ).toArray(
        function ( inner_error, map_list ) {
          callback( map_list );
        }
      );
    }
  );
};

/*
updateObj = function ( obj_type, find_map, set_map, callback ) {
  var type_check_map = checkType( obj_type );
  if ( type_check_map ) {
    callback( type_check_map );
    return;
  }

  checkSchema(
    obj_type, set_map,
    function ( error_list ) {
      if ( error_list.length === 0 ) {
        dbHandle.collection(
          obj_type,
          function ( outer_error, collection ) {
            collection.update(
              find_map,
              { $set : set_map },
              { safe : true, multi : true, upsert : false },
              function ( inner_error, update_count ) {
                callback({ update_count : update_count });
              }
            );
          }
        );
      }
      else {
        callback({
          error_msg  : 'Input document not valid',
          error_list : error_list
        });
      }
    }
  );
};

*/

updateObj = function ( obj_type, find_map, set_map, callback ) {
  var type_check_map = checkType( obj_type );
  if ( type_check_map ) {
    callback( type_check_map );
    return;
  }

  dbHandle.collection(
    obj_type, // user (table/collection
    function ( outer_error, collection ) {
      // TBD - check outer_error
      collection.update(
        find_map,
        { $set : set_map },
        { w : 1, multi : true, upsert : false },

        function ( inner_error, update_count ) {
          // TBD - check inner_error
          callback({ update_count : update_count });
        }
      );
    }
  );
};

destroyObj = function ( obj_type, find_map, callback ) {
  var type_check_map = checkType( obj_type );
  if ( type_check_map ) {
    callback( type_check_map );
    return;
  }

  dbHandle.collection(
    obj_type,
    function ( outer_error, collection ) {
      var options_map = { w:1, single:true };

      collection.remove( find_map, options_map,
        function ( inner_error, delete_count ) {
          callback(inner_error, delete_count );
        }
      );
    }
  );
};

module.exports = {
  makeMongoId : mongodb.ObjectID,
  checkType   : checkType,
  construct   : constructObj,
  read        : readObj,
  update      : updateObj,
  destroy     : destroyObj
};
// ----------------- END PUBLIC METHODS -----------------

// ------------- BEGIN MODULE INITIALIZATION --------------
dbHandle.open( function () {
  console.log( '** Connected to MongoDB **' );
  checkAdminAccnt();
  clearIsOnline();
});

// load schemas into memory (objTypeMap)
(function () {
  var schema_name, schema_path;
  for ( schema_name in objTypeMap ) {
    if ( objTypeMap.hasOwnProperty( schema_name ) ) {
      schema_path = __dirname + '/' + schema_name + '.json';
      loadSchema( schema_name, schema_path );
    }
  }
}());
// -------------- END MODULE INITIALIZATION ---------------
