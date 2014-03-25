/**
 * Created by raynald on 3/19/14.
 */
$(function() {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var
    $msg, $table, $tbody, $btn,
    initModule, getUserInfo, onSubmitChanges;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //--------------------- BEGIN DOM METHODS --------------------
  $msg = $('span.messages');        // status/error message
  $btn = $('.submit-changes-btn');  // submit changes button
  $table = $('.user-table');
  $tbody = $table.find('tbody');

  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  onSubmitChanges = function(evnt) {
    var id_map = {}, $checkbox, len;

    // finds all descendants of tbody, not just children
    // probably and expensive operation
    $checkbox = $tbody.find('input[type=checkbox]');
    len = $checkbox.length;

    // grab any checked checkboxes that we find
    if (len) {
      $checkbox.each(function(idx, el) {
        console.log('typeof idx', typeof idx, 'idx', idx);
        // build array of user ids
        if ( $(el).is(':checked')) {
          id_map[idx] = this.id;
        }
      });
    }

    console.log("onSubmitChanges -> ", "checkboxes:", len, " id_map:", id_map);
    if (Object.keys(id_map).length) {
      // ajax post
      $.ajax({
        url: "/admin/users/delete",
        type: "POST",
        dataType: 'json',
        data: id_map,

        error: function() {
          $msg.html('ajax error :(').css({color: 'orangered'});
        },
        success: function(resp, status) {
          $msg.html(status).css({color: 'green'});
        }
      });

      getUserInfo(); // refresh screen
    }
  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN LOCAL METHODS -------------------
  getUserInfo = function() {

    $tbody.empty();
    $msg.html(''); // clear any errors

    // use ajax to get user info and populate table
    // automatically called when page is (re)loaded
    $.ajax({
      url: "/admin/users",
      type: "GET",
      dataType: 'json',
      error: function() {
        $msg.html('ajax error :(').css({color: 'orangered'});
      },
      success: function(data) {
        var $td, $tr;
        console.log("All Users -> ", data);

        if(data.length > 0) {
          if (data.status && data.msg) {
            $msg.html(data.msg).css({color: 'orangered'});
          } else {
            // Found at least one user.
            // 1. add row for each user
            // 2. fill row with data
            var
              i, user_cnt = data.length,
              arr = ['name', 'email', '_id', 'is_online', 'signed_up', 'last_sign_in'];

            for (i = 0; i < user_cnt; i++) { // each user
              $tr = $('<tr></tr>');
              for(var j = 0; j < arr.length; j++) { // get all data from server
                $td = $('<td></td>');
                $td.text(data[i][arr[j]]);
                $tr.append($td);
              }
              $td = $('<td></td>')
                .html('<input type=checkbox id="' + data[i]['_id'] + '">')
                .addClass('user-table-checkbox');
              $tr.append($td);
              $tbody.append($tr);
            }

          }
        } else {
          $msg.html('No users in database.').css({color: 'orangered'});
        }
      }
    });
  };

  initModule = function() {
    // install handler
    $btn.on('click', onSubmitChanges);
    getUserInfo();

  };
  //------------------- END LOCAL METHODS ---------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  // None
  //------------------- END PUBLIC METHODS ---------------------

  // init our self!
  initModule();

}); // document ready