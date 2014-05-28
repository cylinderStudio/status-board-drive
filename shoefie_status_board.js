// Node server requires . . . 
var express = require('express');
var app = express();
var rest = require('restler');
var auth = require('http-auth');
// var config = require('./creds/config');	// comment out if deploying to Heroku
var stylus = require('stylus');

// constants for .gitignored local values or Heroku environment constants
var BOARD = process.env.BOARD || config.trello.board;
var APP_KEY = process.env.APP_KEY || config.trello.app_key;
var APP_TOKEN = process.env.APP_TOKEN || config.trello.app_token;
var MEMBER_ALLAN = process.env.MEMBER_ALLAN || config.trello.member_allan;
var MEMBER_GREG = process.env.MEMBER_GREG || config.trello.member_greg;
var MEMBER_STEVE = process.env.MEMBER_STEVE || config.trello.member_steve;
var DOING_LIST = process.env.DOING_LIST || config.trello.doing_list;
var TODO_LIST = process.env.TODO_LIST || config.trello.todo_list;

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
app.route('/team').get(function(req,res) {
	var team_statuses = [];

	var getStatus = function(member_id,member_name,member_bio) {
		team_statuses.push({id: member_id, name: member_name, status: member_bio});

		if (team_statuses.length === 3) {
			res.render('team',{title:'Team', team_statuses: team_statuses});
		}
	};

	rest.get("https://www.googleapis.com/drive/v2/files/0B1BcWnbvBZ_CNG80WGwxYmVXdzA?key=AIzaSyDE0Tn-hC864r3ZFsKNREewW9AyaT96hBw");

	rest.get('https://api.trello.com/1/members/' + MEMBER_ALLAN + '?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	}).on('timeout', function(ms){
  		console.log('Trello did not return MEMBER_ALLAN response within ' + ms + ' ms');
	});

	rest.get('https://api.trello.com/1/members/' + MEMBER_GREG + '?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	}).on('timeout', function(ms){
  		console.log('Trello did not return MEMBER_GREG response within ' + ms + ' ms');
	});

	rest.get('https://api.trello.com/1/members/' + MEMBER_STEVE + '?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	}).on('timeout', function(ms){
  		console.log('Trello did not return MEMBER_STEVE response within ' + ms + ' ms');
	});
});