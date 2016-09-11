var request = require('request-promise');
var SlackBot = require('slackbots');
var loreData = require('./lorebot-data');
const slackURI = "https://slack.com/api/";

var self = this;
self.bot = null;
/*

BOT EVENT STUFF 

*/

function onStart(){

	CheckForLoreEmoji();
	CheckForDatabase();
}



/*

EMOJI STUFF

*/


function CheckForLoreEmoji(){
	getSlackEmojiList()
		.then(CheckIfAddLoreExists)
		.then(handleAddLoreExistance)
		.catch(handleSlackRequestError);
}

function getSlackEmojiList(){

	var slackRequestUrl = slackURI + "emoji.list";
	var params = getDefaultSlackParams();

	return request({url: slackRequestUrl, qs: params});
}


function CheckIfAddLoreExists(data){

	console.log(data);
	var data = JSON.parse(data);
	var emoji = data.emoji;

	return 'add-lore' in emoji;	
}

function handleAddLoreExistance(emojisExist){

	if (!emojisExist) {
		self.bot.postMessageToChannel('general', 'You do not have a lore emoji. How do you expect me to add lore?');
	} else{
		self.bot.postMessageToChannel('general', 'Hi guys! Lorebot here, ready to add lore!');
	}
}


/*

MESSAGE STUFF

*/

function handleMessageStream(message){

	if (message.type !== 'reaction_added')
		return;

	console.log(message);//TODO: Only log first time add-lore is done.

	if (message.reaction === 'add-lore') {
		getSlackMessage(message.item)
			.then(handleSlackMessage)
			.then(function(lore, message){
				normalizeLore(lore, message);
			})
			.then(saveLoreToDatabase)
			.catch(handleSlackRequestError);
	}
}


function getSlackMessage(item){

	var slackRequestUrl = slackURI + "channels.history";
	var params = getDefaultSlackParams();
	params.channel = item.channel;
	params.latest = item.ts;
	params.oldest = item.ts;
	params.inclusive = 1;

	return request({url: slackRequestUrl, qs: params });
}

function handleSlackMessage(data){
	//console.log(data);
	data = JSON.parse(data);
	console.log(data.messages[0]);
	originalMessage = data.messages[0];

	var fullLore = {};
	fullLore.author = originalMessage.user;
	fullLore.text = originalMessage.text;
	fullLore.timestamp = originalMessage.ts;

	console.log("Full Lore is: ");
	console.log(fullLore);

	return fullLore;			
}

function normalizeLore(lore, message){
	if (lore === null)
		return;
	lore.loreMaster = message.user;
	lore.timeAdded = message.event_ts;
	return lore;
}

function saveLoreToDatabase(lore){

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

function CheckForDatabase(){
	if (loreData.checkLoreSchema() === false) {
		self.bot.postMessageToChannel('general', 'Seems like I dont have a place to save lore!');
	}
}


exports.setup = setup;