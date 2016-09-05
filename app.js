var SlackBot = require('slackbots');

var settings = {
	name : 'LoreBot',
	token : 'xoxb-76419008017-69ekAqo38HVDVw1w2Lw7qTHV'
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
		console.log("item resides on channel " + item.channel);
		console.log("item timestamp is: " + item.ts);
	}
}