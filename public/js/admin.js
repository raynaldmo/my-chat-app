/**
 * Created by raynald on 3/19/14.
 */
$(function() {

  var $msg = $('span.messages');
  // use ajax to get user info and populate table
  // automatically called when page is (re)loaded
  $.ajax({
      url: "/admin/users",
      type: "GET",
      dataType: 'json',
      error: function() {
        console.info('ajax error :(');
        $msg.html('ajax error :(').css({color: 'orangered'});
      },
      success: function(data) {
        var $table, $tbody, $td, $tr;

        $table = $('.user-table');
        $tbody = $table.find('tbody');

        console.log("All Users -> ", data);

        if(data.length > 0) {
          if (data.status && data.msg) {
            $msg.html(data.msg).css({color: 'orangered'});
          } else {
            // Found at least one user.
            // 1. delete any existing table rows
            $tbody.empty();
            // 2. add row for each user
            // 3. fill row with data
            var
              i, user_cnt = data.length,
              arr = ['name', 'email', '_id', 'is_online', 'signed_up', 'last_sign_in'];

            for (i = 0; i < user_cnt; i++) { // each user
              $tr = $('<tr></tr>');
              for(j = 0; j < arr.length; j++) { // get all data from server
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
            $msg.html(''); // clear any errors
          }
        } else {
          $msg.html('No users in database.').css({color: 'orangered'});
        }
      }
    });


}); // document ready