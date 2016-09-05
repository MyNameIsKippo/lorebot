var SlackBot = require('slackbots');
var request = require('request');

var settings = {
	name : 'LoreBot',
	token : process.env.BOT_API_KEY
}
// create a bot
var bot = new SlackBot(settings);

bot.on('message', handleMessage);

bot.on('start', onStart);

function onStart(){
	var params = {
        icon_emoji: ':cat:'
    };

    // define channel, where bot exist. You can adjust it there https://my.slack.com/services 
    bot.postMessageToChannel('general', 'meow!', params);
}

function handleMessage(message){
	console.log(message);

	if (message.type === 'reaction_added') {
		console.log('Reaction added to message.');
		getMessage(message.item);
	}

	function getMessage(item){
		var slackRequestUrl = "https://slack.com/api/channels.history";

		var params = {};
		params.token = settings.token;
		params.channel = item.channel;
		params.latest = item.ts;
		params.oldest = item.ts;
		params.inclusive = 1;
		params.pretty = 1;

		request({url: slackRequestUrl, qs: params }, handleSlackRequest);

		function handleSlackRequest(err, response, body){
			if (err) {console.log(err); return;}

			if (response.statusCode === 200) {
				console.log("Request didnt fail");
				console.log("Message is: ");
				//console.log(response);
				console.log(body);

				body = JSON.parse(body);
				console.log(body.latest);
				console.log(body.messages);
				console.log(body.messages[0].user);
				console.log(body.messages[0].text);
			}

			

		}

		console.log("item resides on channel " + item.channel);
		console.log("item timestamp is: " + item.ts);

		}
}