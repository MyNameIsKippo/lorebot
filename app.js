var SlackBot = require('slackbots');
var request = require('request-promise');

const slackURI = "https://slack.com/api/";
var settings = {
	name : 'LoreBot',
	token : process.env.BOT_API_KEY
}

// create a bot
var bot = new SlackBot(settings);
bot.on('message', handleMessage);
bot.on('start', onStart);


function onStart(){
	
	getSlackEmojis()
	.then(handleEmojiResponse)
	.catch(handleSlackRequestError);

}

function getSlackEmojis(){
	var slackRequestUrl = slackURI + "emoji.list";

	//TODO: Refactor
	var params = {};
	params.token = settings.token;
	params.pretty = 1;

	return request({url: slackRequestUrl, qs: params});
}

function handleEmojiResponse(data){
	var data = JSON.parse(data);
	var emoji = data.emoji;
	var emojisExist = 'add-lore' in emoji;

	if (!emojisExist) {
		bot.postMessageToChannel('general', 'You do not have an add-lore emoji. How do you expect me to add lore?');
	}
}

function handleMessage(message){
	console.log(message);

	if (message.type === 'reaction_added') {
		console.log('Reaction added to message.');
		getReactionItem(message.item)
		.then(onItemDataResponse)
		.catch(handleSlackRequestError);
	}
}


function getReactionItem(item){

	console.log("item resides on channel " + item.channel);
	console.log("item timestamp is: " + item.ts);

	var slackRequestUrl = slackURI + "channels.history";

	var params = {};
	params.token = settings.token;
	params.channel = item.channel;
	params.latest = item.ts;
	params.oldest = item.ts;
	params.inclusive = 1;
	params.pretty = 1;

	return request({url: slackRequestUrl, qs: params });
	

}

function onItemDataResponse(data){

	console.log("Inside onItemDataResponse");
	console.log(data);
	data = JSON.parse(data);
	
	console.log(data.latest);
	console.log(data.messages);
	console.log(data.messages[0].user);
	console.log(data.messages[0].text);
			
}


function handleSlackRequestError(err){
	console.log("There was an error and you suck");
	console.log(err);
	console.trace(err);
}
