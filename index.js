var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var qs = require('querystring'); // "querystring library
var bodyParser = require('body-parser'); // "body-parser" library
var fs = require('fs');
var tools = require('./tools');
require('dotenv').config()

var app = express();
var port = 3000;

var filePath = __dirname + '/data/'
// Loading jobs data
var bricks = {}
fs.readFile(filePath + 'bricks.json', 'utf8', function (err,data) {
	if (err) {
		return console.log(err);
	}
	console.log(data)
    bricks = JSON.parse(data)
});
// Loading personality data
var bricksDesc = {}
fs.readFile(filePath + 'bricksDesc.json', 'utf8', function (err,data) {
	if (err) {
		return console.log(err);
	}
	console.log(data);
    bricksDesc = JSON.parse(data)
});

var metrics = ["estj", "intj", "istj", "entj", "entp", "intp", "istp", "entp","esfj","isfj","enfj","infj","esfp","isfp","enfp","infp"];
var lenMetric = metrics.length;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


// GET method starts here -->
// This is called mainly from FB chat or testing from browser
app.get('/api/analyze', function(req,res) {
	var screen_name = req.query.screen_name; // $_GET["id"]

	if (screen_name == undefined) {
		res.status(200).send("no screen name");
		return;
	}

	querystring = 'screen_name=' + screen_name;
	var uri = 'https://api.twitter.com/1.1/statuses/user_timeline.json?q=' + qs.escape(querystring) + '&count=100';

	// get twitter keys
	var options = {
		method: 'GET',
		uri: uri,
		oauth: {
			consumer_key: process.env.TWITTER_CONSUMER_KEY,
			consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
			token: process.env.TWITTER_TOKEN,
			token_secret: process.env.TWITTER_TOKEN_SECRET
		}
	};

	request(options, function(error, response,body) {
		if (error) {
			res.send(error.message);
		}

		jsonContent = JSON.parse(body); //parse response to JSON array
		// you can do whatever with the json here and return something else to calling app
		message = JSON.stringify(jsonContent); // just reset the jsonContent to string
		//console.log('content' , message);
		var len = jsonContent.length;
		var contentStr = '';
		console.log('length TW' , len);
		for (var i = 0; i < len; ++i) {
			if (jsonContent[i].text) {
				console.log('text', jsonContent[i].text);
				contentStr += ' ' + jsonContent[i].text;
			}	
		}
	
		// data written to file for debugging
		var fileName = 'tw_' + screen_name;
		fs.writeFile(fileName, contentStr, function (err) {
			if (err) return console.log(err);
			console.log('wrote file' , fileName);
		});
		
		// START personalitity insights
		
		// read input variable from request body
		var inputvariable = JSON.parse('{"contentItems":[{ "content":"testString", "contenttype":"text/plain", "language":"en", "created":1505653346000} ]}');
		//inputvariable.contentItems[0].content = "You are adventurous: you are eager to experience new things. You are energetic: you enjoy a fast-paced, busy schedule with many activities. And you are dispassionate: you do not frequently think about or openly express your emotions.You are motivated to seek out experiences that provide a strong feeling of efficiency.You are relatively unconcerned with both tradition and taking pleasure in life. You care more about making your own path than following what others have done. And you prefer activities with a purpose greater than just personal enjoyment.Additional API functionalities include: application phase video question & answer, create customer, create user, update interview, interview status, request & modify invitation email, remove candidate, request candidate videos.";
		inputvariable.contentItems[0].content = contentStr;
		inputvariable.contentItems[0].created = Date.now();
		inputvariable = JSON.stringify(inputvariable);

		message = JSON.stringify(inputvariable); // just reset the jsonContent to string
		console.log('content PI' , message);
	
		uri = 'https://gateway.watsonplatform.net/personality-insights/api/v3/profile?version=2016-10-20&consumption_preferences=true&raw_scores=true';
		
		// basic authentication is used
		var options = {
			'method': 'POST',
			'uri': uri,
			'headers': {
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + new Buffer(process.env.IBM_PERSONALITY_INSIGHTS_USERNAME + ':' + process.env.IBM_PERSONALITY_INSIGHTS_PASSWORD).toString('base64')
			},
			'body': inputvariable
		};

		request(options, function(error, response,body) {
			try {
				var data = JSON.parse(body);
			} catch(e) {
				console.log('malformed request', body);
				return res.status(400).send('malformed request: ' + body);
			}
			
			if (error) {
				res.send(error.message);
			}
	 
			jsonContent = JSON.parse(body); //parse response to JSON array

			var minMetric = tools.compareTo(jsonContent,metrics);
			var returnString = tools.getMetricText(bricks[minMetric], bricksDesc[minMetric]);

			res.status(response.statusCode).send(returnString);
		});
	});
});
// GET method ends here <--


// POST method requires body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
}));

app.post('/api/post', function(req,res) {
	var twitter_name = req.body.twitter_name;
	var profile = req.body.profile;
	
	
	if (twitter_name == undefined) {
		res.status(200).send("no screen name");
		return;
	} else console.log('twitter_name' , twitter_name);

	querystring = 'screen_name=' + twitter_name;
	var uri = 'https://api.twitter.com/1.1/statuses/user_timeline.json?' + querystring + '&count=100';
	console.log('uri' , uri)

	// get twitter keys
	var options = {
		method: 'GET',
		uri: uri,
		oauth: {
			consumer_key: process.env.TWITTER_CONSUMER_KEY,
			consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
			token: process.env.TWITTER_TOKEN,
			token_secret: process.env.TWITTER_TOKEN_SECRET
		}
	};

	request(options, function(error, response,body) {
		if (error) {
			res.send(error.message);
		}

		jsonContent = JSON.parse(body); //parse response to JSON array
		// you can do whatever with the json here and return something else to calling app
		message = JSON.stringify(jsonContent); // just reset the jsonContent to string
		//console.log('content' , message);
		var len = jsonContent.length;
		var t = '';
		console.log('length TW' , len);
		for (var i = 0; i < len; ++i) {
			if (jsonContent[i].text) {
				console.log('text', jsonContent[i].text);
				t = t + ' ' + jsonContent[i].text;
			}	
		}
		var fileName = 'tw_' + twitter_name;
		fs.writeFile(fileName, t, function (err) {
			if (err) return console.log(err); 
			console.log('wrote file' , fileName);
		});
    
		// START personalitity insights
		if (profile != undefined) {
			t += " " + profile;
		}
		// read input variable from request body
		var inputvariable = JSON.parse('{"contentItems":[{ "content":"testString", "contenttype":"text/plain", "language":"en", "created":1505653346000} ]}');
		//inputvariable.contentItems[0].content = "You are adventurous: you are eager to experience new things. You are energetic: you enjoy a fast-paced, busy schedule with many activities. And you are dispassionate: you do not frequently think about or openly express your emotions.You are motivated to seek out experiences that provide a strong feeling of efficiency.You are relatively unconcerned with both tradition and taking pleasure in life. You care more about making your own path than following what others have done. And you prefer activities with a purpose greater than just personal enjoyment.Additional API functionalities include: application phase video question & answer, create customer, create user, update interview, interview status, request & modify invitation email, remove candidate, request candidate videos.";
		inputvariable.contentItems[0].content = t;
		inputvariable = JSON.stringify(inputvariable);

		message = JSON.stringify(inputvariable); // just reset the jsonContent to string
		console.log('content PI' , message);


		uri = 'https://gateway.watsonplatform.net/personality-insights/api/v3/profile?version=2016-10-20&consumption_preferences=true&raw_scores=true';
		
		// basic authentication is used
		var options = {
			'method': 'POST',
			'uri': uri,
			'headers': {
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + new Buffer(process.env.IBM_PERSONALITY_INSIGHTS_USERNAME + ':' + process.env.IBM_PERSONALITY_INSIGHTS_PASSWORD).toString('base64')
			},
			'body': inputvariable
		};

		request(options, function(error, response,body) {
			try {
				var data = JSON.parse(body);
			} catch(e) {
				console.log('malformed request', body);
				return res.status(400).send('malformed request: ' + body);
			}
		
			if (error) {
				res.send(error.message);
			}

			jsonContent = JSON.parse(body); //parse response to JSON array

			var minMetric = tools.compareTo(jsonContent,metrics);
			console.log('compareAll minMetric',minMetric);
			var returnString = tools.getMetricHtml(bricks[minMetric], bricksDesc[minMetric]);
			message = bricks[minMetric];

			console.log('response PI' , message);
			res.type('application/json');
			//res.set('Content-Length', Buffer.byteLength(returnString));
			res.status(response.statusCode).send(returnString);
		});
  
	});
});

// POST method for testing watson personality insights -->
app.post('/api/simplepost', function(req,res) {

  // read input variable from request body
  inputvariable = JSON.stringify(req.body);
  message = JSON.stringify(inputvariable); // just reset the jsonContent to string
  console.log('content PI' , message);

  uri = 'https://gateway.watsonplatform.net/personality-insights/api/v3/profile?version=2016-10-20&consumption_preferences=true&raw_scores=true';

  var options = {
    'method': 'POST',
    'uri': uri,
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + new Buffer(process.env.IBM_PERSONALITY_INSIGHTS_USERNAME + ':' + process.env.IBM_PERSONALITY_INSIGHTS_PASSWORD).toString('base64')
    },
    'body': inputvariable
  };

  request(options, function(error, response,body) {
    try {
        var data = JSON.parse(body);
    } catch(e) {
        console.log('malformed request', body);
        return res.status(400).send('malformed request: ' + body);
    }
    console.log('body', body);
	if (error) {
      res.send(error.message);
    }

    jsonContent = JSON.parse(body); //parse response to JSON array
	var minMetric = tools.compareTo(jsonContent,metrics);
	var returnString = tools.getMetricText(bricks[minMetric], bricksDesc[minMetric]);
	console.log('response PI' , message);
    res.type('application/json');
    res.set('Content-Length', Buffer.byteLength(returnString));
    res.status(response.statusCode).send(returnString);
  });

});
// POST method ends here <--



console.log('Listening on ' + port);
app.listen(process.env.PORT || port);
