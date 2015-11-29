//Require DB connection!
var db = require('../db/connection.js');
var bcrypt = require('bcrypt-nodejs');
var client = require('../config/redisConnection.js');


module.exports = {

  getStatuses: function (username, callback) {
    client.get('getStatuses' + username, function (err, reply) {
      if (reply) {
        console.log('getStatuses in cache')
        callback(null, JSON.parse(reply));
      } else {
        db.query('select s.id, s.user_id, u.username, s.status, s.created_at, s.vote_tally from statuses s \
          inner join users u where u.username = ? and u.id = s.user_id', [username], function (err, statuses) {
          if (err) {
            callback(err, null);
          } else {
            statuses = statuses.sort(function (a,b) {
              return b.created_at - a.created_at;
            });
            client.set('getStatuses' + username, JSON.stringify(statuses));
            callback(null, statuses);
          }
        });
      }
    })
  },

  getStatusByID: function (statusID, callback) {
    db.query('select s.id, s.user_id, u.username, s.status, s.created_at, s.vote_tally from statuses s \
      inner join users u where s.id = ? and u.id = s.user_id', [statusID], function (err, status) {
        if (err) {
          callback(err);
        } else {
          callback(null, status);
        }
      });
  },

  addStatus: function (data, callback) {
    var date = Date.now();
    db.query('insert into statuses (user_id, status, created_at) values (?, ?, ?)', [data.userID, data.status, date],
      function (err, res) {
        if (err) {
          callback(err, null);
        } else {
          client.del('getStatuses' + data.username, function (err, reply) {
            callback(null, res);
          })
        }
    });
  },

  getFolloweesStatuses: function (followerID, callback) {
    db.query('select u.username, u.profile_photo, s.id, s.status, s.created_at, s.vote_tally from users u \
      inner join followers f \
      inner join statuses s where f.follower_id = ? and f.followee_id = s.user_id and u.id = s.user_id', 
      [followerID], function (err, statuses) {
      if (err) {
        callback(err);
      } else {
        statuses.sort(function (a,b) {
          return b.created_at - a.created_at;
        });
        callback(null, statuses);
      }
    });
  },

  deleteStatus: function (statusID, username, callback) {
    db.query('delete from statuses where id = ?', [statusID], function (err, res) {
      if (err) {
        callback(err);
      } else {
        client.del('getStatuses' + username, function (err, reply) {
          callback(null, res);
        })
      }
    });
  },

  upvote: function (statusID, callback) {
    db.query('update statuses set vote_tally = vote_tally + 1 where id = ?', [statusID], function (err, res) {
      if (err) {
        callback(err);
      } else {
        callback(null, res);
      }
    });
  },

  downvote: function (statusID, callback) {
    db.query('update statuses set vote_tally = vote_tally - 1 where id = ?', [statusID], function (err, res) {
      if (err) {
        callback(err);
      } else {
        callback(null, res);
      }
    })
  },

  addUserLikeForStatus: function (userID, statusID, username, callback) {
    db.query('insert into status_votes (user_id, status_id) values (?, ?)', [userID, statusID], function (err, res) {
      if (err) {
        callback(err);
      } else {
        client.del('getStatuses' + username, function (err, reply) {
          callback(null, res);
        })
      }
    });
  },

  removeUserLikeForStatus: function (userID, statusID, username, callback) {
    db.query('delete from status_votes where user_id = ? and status_id = ?', [userID, statusID], function (err, res) {
      if (err) {
        callback(err);
      } else {
        client.del('getStatuses' + username, function (err, reply) {
          callback(null, res);
        })
      }
    })
  },

  getUserStatusVotes: function (userID, callback) {
    db.query('select s.id from statuses s inner join status_votes sv where sv.status_id = s.id and sv.user_id = ?', [userID], function (err, res) {
      if (err) {
        callback(err);
      } else {
        callback(null, res);
      }
    })
  }
  
}