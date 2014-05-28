status-board
============

*Display Trello data in Panic Status Board with Node.js*

This is a Node.js application that uses the Trello API to take project and team member data, process and format the data, then respond to the browser with HTML for Panic's Status Board iOS application.

### Built with:
- Node.js
- Express
- Restler (npm module for REST calls)
- http-auth (npm module for simple http authentication)
- Jade HTML templating
- Stylus CSS templating

### Credentials

To keep credentials safe (Trello keys and tokens, as well as http-auth username and password) they should be kept in a config.js file that is in a git-ignored 'creds' directory. And load that file with a Node 'require' statement.

status_board.js:

```
var config = require('./creds/config');	// comment out if deploying to Heroku
```

/creds/config.js:

```
// Trello key, token and values
// These, of course, aren't real values for Trello. Get your app key and token from developer setup in Trello, and then making an initial call and perusing the results will give you keys for boards, members, lists, etc.

module.exports.trello = {
	board: '00aa123456',
	app_key: '00bb123456',
	app_token: '00cc123456',
	member_allan: '00dd123456',
	member_greg: '00ee123456',
	member_steve: '00ff123456',
	doing_list: '00gg123456',
	done_list: '00hh123456',
	todo_list: '00ii123457'
}

module.exports.authenticate = {
	username: 'userName',
	password: 'passWord'
}
```

### Deployment

I deployed to Heroku, in which case I set configuration variables for the credentials I had been getting from config.js in production. The commenting out of the 'config' variable in status_board.js and the conditional setting of the constants like BOARD, APP_KEY, etc. allowed deployment there.

status_board.js:

```
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
```
