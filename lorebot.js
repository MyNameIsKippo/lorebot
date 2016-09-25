var request = require('request-promise');
var Rx = require('rx');
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


function handleTrunksmeReaction(message){
		self.channel = message.item.channel;

		console.log("Inside HandleTrunksMe. Message is " + message)

		var slackMessage = getSlackMessage(message.item)
			.then(handleSlackMessage);

		var user = getSlackUser(message.item_user);


		Promise.all([slackMessage,user])
			.then(trunksifyLore)
			.then(echoTrunksifiedLore)
			.catch(handleSlackRequestError);
}

function handleAddLoreReaction(message){

	var slackMessage = message;
	getSlackMessage(message.item)
			.then(handleSlackMessage)
			.then(function(lore){
				normalizeLore(lore, slackMessage);
			})
			.then(saveLoreToDatabase)
			.catch(handleSlackRequestError);
}

function trunksifyLore(data){
	var lore = data[0];
	var userData = JSON.parse(data[1]);

	if (lore.author === null)
		return;

	var trunksifiedLore = "";
	lore.text = lore.text.replace(/'/g, "\\'");
	//LOL Javascript. Actually I think the add-lore does this automatically.
	var loreDate = new Date(lore.timestamp.split(".")[0] * 1000);

	trunksifiedLore += "$ loredb add \"{0}\" \"{1}\"";

	//TODO: make it so time is given in a less dumb way.
	trunksifiedLore = trunksifiedLore.format(userData.user.name, lore.text);

	return trunksifiedLore;

}

function echoTrunksifiedLore(lore){

	self.bot.postMessage(self.channel, lore)
	.catch(handleSlackRequestError);
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

function getSlackUser(userid){
	console.log("Looking for user " + userid);
	var slackRequestUrl = slackURI + "users.info";
	var params = getDefaultSlackParams();
	params.user = userid;

	return request({url: slackRequestUrl, qs: params });
}

function handleSlackMessage(data){

	data = JSON.parse(data);
	console.log(data.messages[0]);
	originalMessage = data.messages[0];

	var fullLore = {};
	fullLore.author = originalMessage.user;
	fullLore.text = originalMessage.text;
	fullLore.timestamp = originalMessage.ts;

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
	//TODO: Do something.
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


if (!String.prototype.format) {
    String.prototype.format = function() {
        var str = this.toString();
        if (!arguments.length)
            return str;
        var args = typeof arguments[0],
            args = (("string" == args || "number" == args) ? arguments : arguments[0]);
        for (arg in args)
            str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
        return str;
    }
}


/*

INIT STUFF 

*/

function setup(settings){
	self.token = settings.token;
	self.bot = new SlackBot(settings);
	self.bot.on('start', onStart);

	init();
}

function init(){
	var messageSource = Rx.Observable.fromEvent(self.bot, 'message');
	var reactionAddedMessages = messageSource.filter(x => x.type === 'reaction_added');
	var trunksmeMessages = reactionAddedMessages.filter(x => x.reaction === 'trunksme');
	var addLoreMessages = reactionAddedMessages.filter(x => x.reaction === 'add-lore');

	var trunksmeSubscription = trunksmeMessages.subscribe(handleTrunksmeReaction, handleSlackRequestError);
	var addLoreSubscription = addLoreMessages.subscribe(handleAddLoreReaction, handleSlackRequestError);
}



exports.setup = setup;
