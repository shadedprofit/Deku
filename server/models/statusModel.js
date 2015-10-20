//Require DB connection!
var db = require('../db/connection.js');
var bcrypt = require('bcrypt-nodejs');


module.exports = {

  getStatuses: function (id, callback) {
      db.query('select * from statuses where user_id = ?', [id], function (err, statuses) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, statuses);
        }
      })
    },

  addStatus: function (data, callback) {
    db.query('insert into statuses (user_id, status) values (?, ?)', [data.userID, data.status],
      function (err, res) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, res.insertID);
        }
    });
  },

  getFriendsStatuses: function (id, callback) {
    db.query('select * from statuses where id = ?', [id], function (err, statuses) {
      if (err) {
        callback(err);
      } else {
        callback(null, statuses);
      }
    })
  }
  
}