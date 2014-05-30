// Node server requires . . . 
var express = require('express');
var app = express();
var rest = require('restler');
var auth = require('http-auth');
var config = require('./creds/config');	// comment out if deploying to Heroku
var stylus = require('stylus');

var GoogleTokenProvider = require("refresh-token").GoogleTokenProvider,
    async = require('async'),
    request = require('request'),
    _accessToken;

// constants for .gitignored Google API credentials
var CLIENT_ID = process.env.CLIENT_ID || config.google.client_id;
var CLIENT_SECRET = process.env.CLIENT_SECRET || config.google.client_secret;
var REFRESH_TOKEN = process.env.REFRESH_TOKEN || config.google.refresh_token;
var ENDPOINT_OF_GDRIVE = process.env.ENDPOINT_OF_GDRIVE || config.google.endpoint_of_gdrive;
var FOLDER_ID = process.env.FOLDER_ID || config.google.folder_id;

// Jade configuration
app.set('views', __dirname + '/views')
app.set('view engine', 'jade');

// Stylus configuration
app.use(stylus.middleware({
  src: __dirname + '/resources',
  dest: __dirname,
  force: true
}));

// Static paths for local image, stylesheet and script load
app.use('/images', express.static(__dirname + '/images'));
app.use('/stylesheet', express.static(__dirname + '/stylesheet'));
app.use('/js', express.static(__dirname + '/js'));

// Fire it up
//app.listen(process.env.PORT || 8080);

// Routes
//app.route('/team').get(function(req,res) {
	//var shoefie_images = [];

// UPLOAD TO GOOGLE DRIVE
async.waterfall([
	  //-----------------------------
	  // Obtain a new access token
	  //-----------------------------
	  function(callback) {
	    var tokenProvider = new GoogleTokenProvider({
	      'refresh_token': REFRESH_TOKEN,
	      'client_id': CLIENT_ID,
	      'client_secret': CLIENT_SECRET
	    });

	    tokenProvider.getToken(callback);
	  },

	  //--------------------------------------------
	  // Retrieve the children in a specified folder
	  // 
	  // ref: https://developers.google.com/drive/v2/reference/files/children/list
	  //-------------------------------------------
	  function(accessToken, callback) {
	    _accessToken = accessToken;
	    request.get({
	      'url': ENDPOINT_OF_GDRIVE + '/files/' + FOLDER_ID + '/children',
	      'qs': {
	        'access_token': accessToken
	      }
	    }, callback);
	  },

	//----------------------------
	// Parse the response
  	//----------------------------
  	function(response, body, callback) {
    	var list = JSON.parse(body);
    	if (list.error) {
      		return callback(list.error);
    	}
    	callback(null, list.items);
	},

	//-------------------------------------------
	// Get the file information of the children.
	//
	// ref: https://developers.google.com/drive/v2/reference/files/get
	//-------------------------------------------
	function(children, callback) {
	    async.map(children, function(child, cback) {
	    	request.get({
	        	'url': ENDPOINT_OF_GDRIVE + '/files/' + child.id,
	        	'qs': {
	          		'access_token': _accessToken
	        	}
	      	},
	    	function(err, response, body) {
	        	body = JSON.parse(body);
	        	cback(null, {
	        		'title': body.title,
	        		'thumbnailLink': body.thumbnailLink,
	        		'createdDate': body.createdDate
	      		});
	        });
	  	}, callback);
	  	//push objects with named time stamped image to shoefie_images array
	}
], function(err, results) {
	if (!err) {
		console.log(results);
	}
});

//});