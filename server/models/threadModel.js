//Require DB connection!
var db = require('../db/connection.js');
var bcrypt = require('bcrypt-nodejs');
var client = require('../config/redisConnection.js');

module.exports = {

	getAllThreads: function (callback) {
		db.query('select * from threads', function (err, threads) {
			if (err) {
				callback(err);
			} else {
				callback(null, threads);
			}
		})
	},

	getAllMessages: function (callback) {
		db.query('select * from messages', function (err, messages) {
			if (err) {
				callback(err);
			} else {
				callback(null, messages);
			}
		})
	},

	getThreadsByPage: function (page, callback) {
		client.get('getThreadsByPage', function (err, reply) {
			if (reply) {
				var result = JSON.parse(reply);
				var filteredResult = {
							count: result.length,
							threads: result.splice((page - 1) * 20, 20)
						}
				callback(null, filteredResult);
			} else {
				db.query('select t.id, t.thread, t.created_at, t.last_updated, t.messages_count, t.vote_tally, t.user_id, u.username, u.profile_photo \
				 from threads t inner join users u where u.id = t.user_id', function (err, threads) {
					if (err) {
						callback(err);
					} else {
						// iterate over results, adding a rank property
						for (var i = 0; i < threads.length; i++) {
						// rank will be determined by a mix of votes, number of comments, and age of thread
						// the longer the thread has been inactive, the lower it's resulting rank, and vice versa
							// convert date time object from sql into javascript date time object
							var lastUpdated = new Date(threads[i].last_updated);
							var ageInDays = ( lastUpdated.getTime() - new Date(1970,1,1).getTime() ) / (60 * 60 * 24);
							threads[i].rank = (threads[i].vote_tally + threads[i].messages_count) * (1 / ageInDays);
						}
						// Sort the now ranked threads by their rank (b - a)
						threads.sort(function (a, b) {
							return b.rank - a.rank;
						});
						client.set('getThreadsByPage', JSON.stringify(threads));
						client.expire('getThreadsByPage', 86400);
						// Store these sorted threads by groups of 20 in an object
						var filteredThreads = {
							count: threads.length,
							threads: threads.splice((page - 1) * 20, 20)
						}
						// return 
						callback(null, filteredThreads);
					}
				});
			}
		})
	},

	getMessagesByPage: function (threadID, page, callback) {
		client.get('getMessagesByPage' + threadID, function (err, reply) {
			if (reply) {
				var result = JSON.parse(reply);
				var filteredResult = {
					messages: result.splice((page - 1) * 20, 20)
				};
				callback(null, filteredResult);
			} else {
				db.query('select m.id, m.message, m.created_at, m.user_id, m.thread_id, m.vote_tally, u.username, u.profile_photo from messages m \
					inner join users u where m.thread_id = ? and u.id = m.user_id', [threadID], function (err, messages) {
					if (err) {
						callback(err);
					} else {
						// sort by date from oldest to most current
						messages.sort(function (a,b) {
							return a.created_at - b.created_at;
						});
						client.set('getMessagesByPage' + threadID, JSON.stringify(messages));
						client.expire('getMessagesByPage' + threadID, 86400);
						var filteredMessages = {
							messages: messages.splice((page - 1) * 20, 20)
						};
						callback(null, filteredMessages);
					}
				});
			}
		})
	},

	getMessageByID: function (messageID, callback) {
		db.query('select * from messages where id = ?', [messageID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		})
	},

	getThreadByID: function (threadID, callback) {
		db.query('select t.id, t.user_id, t.thread, t.created_at, t.last_updated, t.messages_count, t.vote_tally, u.username, u.profile_photo \
		 from threads t inner join users u where t.id = ? and u.id = t.user_id', [threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		});
	},

	addMessageToThread: function (data, callback) {
		var date = Date.now();
		db.query('insert into messages (user_id, message, thread_id, created_at) values (?, ?, ?, ?)', [data.userID, data.message, data.threadID, date],
			function (err, res) {
				if (err) {
					callback(err);
				} else {
					client.del('getRecentForumActivity' + data.username);
					client.del('getMessagesByPage' + data.threadID, function (err, reply) {
						callback(null, res);
					});
				}
			});
	},

	createThread: function (userID, threadName, callback) {
		var date = Date.now();
		db.query('insert into threads (user_id, thread, created_at, last_updated) value (?, ?, ?, ?)', [userID, threadName, date, date], function (err, res) {
			if (err) {
				callback(err);
			} else {
				client.del('getThreadsByPage', function (err, reply) {
					callback(null, res);
				})
			}
		});
	},

	deleteThread: function (threadID, callback) {
		db.query('delete from threads where id = ?', [threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				client.del('getThreadsByPage');
				client.del('getMessagesByPage' + threadID);
				callback(null, res);
			}
		});
	},

	deleteMessage: function (messageID, callback) {
		db.query('delete from messages where id = ?', [messageID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		})
	},

	updateTimeAndMessagesForThread: function (threadID, callback) {
		var time = Date.now();
		db.query('update threads set messages_count = messages_count + 1, last_updated = ? where id = ?', [time, threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		})
	},
 
	updateTime: function (threadID, callback) {
		var time = Date.now();
		db.query('update threads set last_updated = ? where id = ?', [time, threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		})
	},

	upvoteThread: function (threadID, callback) {
		db.query('update threads set vote_tally = vote_tally + 1 where id = ?', [threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		});
	},

	downvoteThread: function (threadID, callback) {
		db.query('update threads set vote_tally = vote_tally - 1 where id = ?', [threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		})
	},

	addUserLikeToThread: function (userID, threadID, callback) {
		db.query('insert into thread_votes (user_id, thread_id) values (?, ?)', [userID, threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				client.del('getUserThreadVotes' + userID, function (err, reply) {
					callback(null, res);
				})
			}
		});
	},

	removeUserLikeFromThread: function (userID, threadID, callback) {
		db.query('delete from thread_votes where user_id = ? and thread_id = ?', [userID, threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		});
	},

	upvoteMessage: function (messageID, callback) {
		db.query('update messages set vote_tally = vote_tally + 1 where id = ?', [messageID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		})
	},

	downvoteMessage: function (messageID, callback) {
		db.query('update messages set vote_tally = vote_tally - 1 where id = ?', [messageID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res);
			}
		});
	},

	addUserLikeForMessage: function (userID, messageID, threadID, callback) {
		db.query('insert into message_votes (user_id, message_id, thread_id) values (?,?,?)', [userID, messageID, threadID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				client.del('getUserMessageVotes_threadID' + threadID + '_userID' + userID);
				callback(null, res);
			}
		})
	},

	removeUserLikeFromMessage: function (userID, messageID, threadID, callback) {
		db.query('delete from message_votes where user_id = ? and message_id = ?', [userID, messageID], function (err, res) {
			if (err) {
				callback(err);
			} else {
				client.del('getUserMessageVotes_threadID' + threadID + '_userID' + userID);
				callback(null, res);
			}
		})
	},

	getRecentForumActivity: function (username, callback) {
		client.get('getRecentForumActivity' + username, function (err, reply) {
			if (reply) {
				callback(null, JSON.parse(reply));
			} else {
				db.query('select u.username, m.id, m.message, m.created_at, m.thread_id, m.vote_tally, t.thread from messages m \
					inner join users u inner join threads t where m.user_id = u.id and m.thread_id = t.id and u.username = ?', [username], function (err, res) {
						if (err) {
							callback(err);
						} else {
							res.sort(function (a, b) {
								return b.created_at - a.created_at;
							});
							// return only the most recent 10 results
							var filteredMessages = res.splice(0,10);
							client.set('getRecentForumActivity' + username, JSON.stringify(filteredMessages));
							callback(null, filteredMessages);
						}
				});
			}
		})
	},

	getRecentFolloweeActivity: function (userID, callback) {
		db.query('select u.username, u.profile_photo, m.id, m.message, m.created_at, m.thread_id, m.vote_tally, t.thread \
			from followers f inner join users u inner join messages m inner join threads t \
			where f.followee_id = u.id and m.thread_id = t.id and f.followee_id = m.user_id and f.follower_id = ?', [userID], function (err, res) {
				if (err) {
					callback(err);
				} else {
					// sort from most recent to least recent
					res.sort(function (a,b) {
						return b.created_at - a.created_at;
					});
					callback(null, res);
				}
		});
	},

	getUserMessageVotes: function (userID, threadID, callback) {
		client.get('getUserMessageVotes_threadID' + threadID + '_userID' + userID, function (err, reply) {
			if (reply) {
				callback(null, JSON.parse(reply));
			} else {
				db.query('select m.id from users u inner join message_votes mv \
					inner join messages m where mv.user_id = u.id and m.id = mv.message_id and mv.thread_id = ? and m.user_id = ?', [threadID, userID], function (err, res) {
						if (err) {
							callback(err);
						} else {
							client.set('getUserMessageVotes_threadID' + threadID + '_userID' + userID, JSON.stringify(res));
							callback(null, res);
						}
					})
			}
		})
	},

	getUserThreadVotes: function (userID, callback) {
		client.get('getUserThreadVotes' + userID, function (err, reply) {
			if (reply) {
				callback(null, JSON.parse(reply));
			} else {
				db.query('select t.id from threads t inner join thread_votes tv where tv.user_id = ? and t.id = tv.thread_id', [userID], function (err, res) {
					if (err) {
						callback(err);
					} else {
						client.set('getUserThreadVotes' + userID, JSON.stringify(res));
						callback(null, res);
					}
				})
				
			}
		})
	}
  
}