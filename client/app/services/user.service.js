(function() {
  'use strict';

  angular.module('app')
    .factory('User', User);

  User.$inject = ['$http', '$window', '$state', 'jwtHelper', 'Upload'];

  function User($http, $window, $state, jwtHelper, Upload) {

    var services = {
      signin: signin,
      signout: signout,
      signup: signup,
      getID: getID,
      getAvatar: getAvatar,
      addAvatarPath: addAvatarPath,
      getPhotos: getPhotos,
      addPhotoByPath: addPhotoByPath,
      addPhotoByUpload: addPhotoByUpload,
      deletePhoto: deletePhoto,
      getFollowers: getFollowers,
      getFollowees: getFollowees,
      follow: follow,
      unfollow: unfollow,
      addNotification: addNotification,
      deleteNotification: deleteNotification,
      getNotifications: getNotifications,
      getProfile: getProfile,
      updateProfile: updateProfile,
      getRecentThreads: getRecentThreads,
      addStatus: addStatus,
      deleteStatus: deleteStatus,
      getStatuses: getStatuses,
      getFolloweesStatuses: getFolloweesStatuses,
      likeStatus: likeStatus,
      addTag: addTag,
      getTags: getTags,
      removeTag: removeTag,
      getUsersForTag: getUsersForTag,
      enableTessel: enableTessel
    };

    return services;
    ///////////////////////
    /////TESSEL////////////
    ///////////////////////

    function enableTessel(userID) {
      return $http.put('/users/tessel/'+userID)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          throw res.status;
        });
    }

    ///////////////////////
    /////AUTHENTICATION////
    ///////////////////////

    function signin(data) {
      return $http.post('/auth/signin', data)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          throw res.status;
        });
    }

    function signout() {
      delete $window.localStorage.token;
      delete $window.localStorage.username;
      delete $window.localStorage.tesselStatus;
      $state.transitionTo('splash');
    }

    function signup(data) {
      return $http.post('/auth/signup', data)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          throw res.status;
        });
    }

    // return active user's ID
    function getID() {
      return jwtHelper.decodeToken($window.localStorage.token).id;
    }

    ///////////////////////
    ////////PHOTOS/////////
    ///////////////////////

    // retrieve a user's profile photo
    function getAvatar(username) {
      return $http.get('/users/avatarpath/' + username)
        .then(function successCallback(res) {
          return res.data.avatarURL;
        }, function errorCallback(res) {
          console.log('Error retrieving avatar');
        });
    }

    function addAvatarPath(userID, path) {
      return $http.post('/users/avatarpath/' + userID, { photo: path, username: $window.localStorage.username }) 
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error adding avatar path");
        })
    }

    function getPhotos(username) {
      return $http.get('/users/photos/' + username) 
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving user photos');
        });
    }

    function addPhotoByPath(userID, path) {
      return $http.post('/users/photos/path/' + userID, { photo: path, username: $window.localStorage.username }) 
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error posting photo by path');
        });
    }

    function addPhotoByUpload(userID, file) {
        return Upload.upload({
          url: '/users/photos/upload/' + userID,
          data: {
            file: file,
            username: $window.localStorage.username
          }
        }).then(function successCallback(res) {
          console.log("Success loading photo. Res is ", res);
          return res.data;
        }, function errorCallback(res) {
          console.log('Error uploading photo', res);
        }, function progressTracker(evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    }

    function deletePhoto(userID, photoID) {
      return $http.delete('/users/photos/' + userID + '/' + photoID, { username: $window.localStorage.username })
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error deleting photo');
        });
    }

    ///////////////////////
    /////FOLLOWERS/////////
    ///////////////////////

    // retrieve followers AND following lists 
    function getFollowers (username) {
      return $http.get('/follow/followers/' + username)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving followers');
        });
    }

    function getFollowees (username) {
      return $http.get('/follow/followees/' + username)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error retrieving followees");
        });
    }

    function follow (followerID, followeeName) {
      return $http.post('/follow/' + followerID + '/' + followeeName, { username: $window.localStorage.username })
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error adding follower");
        });
    }

    function unfollow (followerID, followeeName) {
      return $http.delete('/follow/' + followerID + '/' + followeeName, { username: $window.localStorage.username }) 
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error deleting follower");
        });
    }

    ///////////////////////
    /////NOTIFICATIONS/////
    ///////////////////////

    function addNotification(username, data) {
      return $http.post('/notifications/' + username, data)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error adding notification");
        });
    }

    function deleteNotification(notificationID) {
      return $http.delete('/notifications/' + notificationID)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error deleting notification');
        });
    }

    function getNotifications(userID) {
      return $http.get('/notifications/' + userID)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving notifications');
        });
    }

    ///////////////////////
    /////PROFILE INFO//////
    ///////////////////////

    // retrieve user profile information
    function getProfile(username) {
      return $http.get('/users/' + username)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving user profile');
        });
    }

    // update an existing user's profile info
    function updateProfile(data, userID) {
      var url = '/users/' + userID;
      data.username = $window.localStorage.username;
      return $http.put(url, data)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error updating user profile');
        });
    }

    ///////////////////////
    ////FORUM / THREADS////
    ///////////////////////

    // retrieve user's most recent forum posts
    function getRecentThreads(username) {
      return $http.get('/threads/recent/' + username)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving recent threads');
        });
    }

    ///////////////////////
    ////////STATUSES///////
    ///////////////////////

    function addStatus(status, userID) {
      return $http.post('/status/' + userID, { status: status, username: $window.localStorage.username })
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error posting status');
        });
    }

    function deleteStatus(statusID) {
      return $http.delete('/status/' + statusID, { username: $window.localStorage.username })
        .then(function successCallback(res) {
          return res;
        }, function errorCallback(res) {
          console.log('Error deleting status');
        });
    }

    // retrieve user statuses
    function getStatuses(username, currentUserID) {
      return $http.get('/status/' + username + '/' + currentUserID)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving statuses');
          throw res;
        });
    }

    function getFolloweesStatuses(userID) {
      return $http.get('/status/followees/' + userID)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving friends statuses');
        });
    }

    function likeStatus(userID, statusID) {
      return $http.post('/status/vote/' + userID + '/' + statusID)
        .then(function successCallback(res) {
          return res.status;
        }, function errorCallback(res) {
          console.log("Error liking status");
        })
    }

    ///////////////////////
    ////////TAGS///////////
    ///////////////////////

    function addTag(tag, userID) {
      return $http.post('/users/tags/' + userID, { tag: tag, username: $window.localStorage.username }) 
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error posting status");
        });
    }

    function getTags(username) {
      return $http.get('/users/tags/' + username)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log('Error retrieving tags');
        });
    }

    function removeTag(tagID, userID) {
      return $http.delete('/users/tags/' + tagID + '/' + userID, { username: $window.localStorage.username })
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error deleting tag");
        });
    }

    function getUsersForTag(tagname) {
      return $http.get('users/tags/associated/' + tagname)
        .then(function successCallback(res) {
          return res.data;
        }, function errorCallback(res) {
          console.log("Error get asscoiated users for the tag");
        });
    }
  }
})();
