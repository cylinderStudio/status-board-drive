// Node server requires . . . 
var express = require('express');
var app = express();
var rest = require('restler');
var auth = require('http-auth');
// var config = require('./creds/config');	// comment out if deploying to Heroku
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
var STORE_1_FOLDER = process.env.STORE_1_ID || config.google.store_1_id;
var STORE_4_FOLDER = process.env.STORE_4_ID || config.google.store_4_id;

var USERNAME = process.env.USERNAME || config.authenticate.username;
var PASSWORD = process.env.PASSWORD || config.authenticate.password;

// HTTP authentication
var basic = auth.basic({realm: "Status Board"}, 
	function(username,password,callback) {
		callback(username === USERNAME && password === PASSWORD);
	}
);

app.use(auth.connect(basic));

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
app.listen(process.env.PORT || 8080);

// Routes
app.route('/shoefies/:folder_id').get(function(req,res) {
	var shoefie_images = [];

	if (req.params.folder_id === 'store_1') {
		var FOLDER_ID = STORE_1_FOLDER;
		var table_title = "Store 1";
	} else if (req.params.folder_id === 'store_4') {
		var FOLDER_ID = STORE_4_FOLDER;
		var table_title = "Store 4";
	}

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

	        	var timeString = constructTimeString(body.title);

	        	cback(null, {
	        		'title': timeString,
	        		'thumbnailLink': body.thumbnailLink,
	        		'createdDate': body.createdDate
	      		});
	        });
	  	}, callback);
		}
	], function(err, results) {
		if (!err) {
			shoefie_images = results.sort(
				function(a,b) {
					if (a.createdDate < b.createdDate) return 1;
			    if (a.createdDate > b.createdDate) return -1;
			    return 0;
				}).slice(0,3);
			res.render('shoefie', {title: 'Shoefies', table_title: table_title, shoefie_images: shoefie_images});
		}
	});

// string/format helpers

function constructTimeString(tempString) {
	// assuming this format for now to avoid complex regex: STORE1_0601_0425.jpg
	var mo = parseForZero(tempString.slice(7,9));
	var day = parseForZero(tempString.slice(9,11));
	var hr = parseForZero(tempString.slice(12,14));
	var min = tempString.slice(14,16);

	var tempString = mo + '/' + day + ' ' + hr + ':' + min;

	return tempString;
}

function parseForZero(zeroString) {
	if (zeroString.charAt(0) === "0") {
		zeroString = zeroString.slice('-1');
	}

	return zeroString;
}

});