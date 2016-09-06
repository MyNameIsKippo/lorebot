var request = require('request-promise');
var SlackBot = require('slackbots');
const slackURI = "https://slack.com/api/";

var self = this;
self.bot = null;
/*

BOT EVENT STUFF 

*/

function onStart(){
	CheckForLoreEmoji();    
}



/*

EMOJI STUFF

*/


function CheckForLoreEmoji(){
	getSlackEmojis().then(handleEmojiResponse).then(handleLoreEmojiResponse);
}

function getSlackEmojis(){
	var slackRequestUrl = slackURI + "emoji.list";
	var params = getDefaultSlackParams();
	
	return request({url: slackRequestUrl, qs: params});
}


function handleEmojiResponse(data){
	console.log(data);
	var data = JSON.parse(data);
	var emoji = data.emoji;
	return 'add-lore' in emoji;	
}

function handleLoreEmojiResponse(emojisExist){
		if (!emojisExist) {
		self.bot.postMessageToChannel('general', 'You do not have a lore emoji. How do you expect me to add lore?');
	}
}


/*

MESSAGE STUFF

*/

function handleMessageStream(message){
	console.log(message);

	if (message.type === 'reaction_added') {
		console.log('Reaction added to message.');
		getReactionItem(message.item)
		.then(onItemDataResponse)
		.catch(handleSlackRequestError);
	}
}


function getReactionItem(item){

	var slackRequestUrl = slackURI + "channels.history";
	var params = getDefaultSlackParams();
	params.channel = item.channel;
	params.latest = item.ts;
	params.oldest = item.ts;
	params.inclusive = 1;

	return request({url: slackRequestUrl, qs: params });
}

function onItemDataResponse(data){
	data = JSON.parse(data);			
}


/*

GENERIC STUFF

*/


function handleSlackRequestError(err){
	console.log("There was an error and you suck");
	console.log(err);
	console.trace(err);
}

function getDefaultSlackParams(token){
	return {
		token : self.token,
		pretty : 1
	}
}


/*

INIT STUFF 

*/

function setup(settings){
	self.token = settings.token;

	self.bot = new SlackBot(settings);
	self.bot.on('message', handleMessageStream);
	self.bot.on('start', onStart);
}

exports.setup = setup;