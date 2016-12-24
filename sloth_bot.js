const Discord = require("discord.js")
const url = require("url");
const bot = new Discord.Client();

const YoutubeVideo = require("./youtube_video");
const VideoSaver = require("./video_saver");
const commands = require("./commands");
const config = require("./config");

const url_regex = /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/
var token = null;
var videoQueue = [];
var currentStream = null;
var currentVideo = null;
var currentChannel = null;
var currentVoiceChannel = null;
var volume = 0.25; //Default to 1 quarter
var currentDispatcher = null;
var commandHandler = new Commands();

// Grab the arguments
process.argv.forEach(function (val, index, array) {
	if (val.match("(DISCORD_API_KEY|YOUTUBE_API_KEY)")) {
		var result = val.match("(DISCORD_API_KEY|YOUTUBE_API_KEY)=(.+)");
		if (val.match("DISCORD_API_KEY=(.+)")) { //specifically the discord api key
			config.setToken(result[2]);
			token = config.getToken();
		}
		if (val.match("YOUTUBE_API_KEY=(.+)")) { //specifically the youtube api key
			config.setYoutubeApiKey(result[2]);
			YoutubeVideo.setYoutubeApiKey(result[2]);
		}
	}
});

if (token == null) {
	console.log("ERROR! NO DISCORD TOKEN PROVIDED");
}

process.on("unhandledRejection", (reason, promise) => {
	console.log(reason);
	console.log(promise);
});

bot.on("ready", () => {
	commandHandler.setPrefix("-")
				// If the yt or sc is forgotten, default to youtube
				.register("play (yt|youtube)?", {params: 1}, processPlayParameters)
				.register("commands", {}, displayCommands)
				.register("(matt meme|mattmeme)", {}, mattMeme)
				.register("mexican beep song", {result: "https://www.youtube.com/watch?v=x47NYUbtYb0"}, processPlayParameters)
				.register("sexy sax man", {result: "https://www.youtube.com/watch?v=GaoLU6zKaws"}, processPlayParameters)
				.register("next", {}, next)
				.register("stop", {}, stop)
				.register("clear", {}, clear)
				.register("(volume|vol)", {params: 1}, displayOrCheckVolume);
	console.log("I am ready!");
});

bot.on("message", message => {
	if (message.author.bot) {
		return;
	}
	if (message.content.match(/^-(.+)/)) {
		console.log(message.content);
	}
	findVoiceChannel(message);
	currentChannel = message.channel;
	if (!checkGuildPermissions(message)) {
		return;
	}
	commandHandler.on(message.content, message); // Handle the -play commands.
});

function mattMeme(message) {
	currentChannel.sendMessage("I'm sure of what I said, but I'm not sure why I said it. - Matt")
}

function displayCommands(message) {
	currentChannel.sendMessage("**Commands** \n -play 'url' \n -next play the next video in queue if any. \n -stop stop the current video \n -vol 'vol' set the volume \n -vol print out the volume.")
}

function checkGuildPermissions(message) {
	if (!message.guild.roles.find("name", "SlothMaster")) {
		currentChannel.guild.createRole({name: "SlothMaster"})
										.then(role => {
											currentChannel.sendMessage("There is no SlothMaster in this channel. The role will be made");
											console.log("Created role: " + role)
										}, error => {
											currentChannel.sendMessage("There was an error with creating the role, will now try to add role.")
										})
										.catch(console.error);
	}
	return true;
}

function checkPermissions(message) {
	var member = message.channel.guild.members.find("id", message.author.id)
	var has_permission = member && member.roles && member.roles.find("name", "SlothMaster");
	if (!has_permission) {
		currentChannel.sendMessage(message.author.username + " you do not have permission to perform this command: " + message.content);
	}
	return has_permission;
}

function displayOrCheckVolume(message, parse) {
	if (!checkPermissions(message)){
		return;
	}
	if (parse && typeof parse != 'string' && parse.length != 0) {
		parse = parse[parse.length - 1];
	} else {
		currentChannel.sendMessage("The current volume is " + volume*100.0);
		return;
	}
	parse = parseInt(parse)
	if (parse != null) {
		volume = parse/100.0;
		currentChannel.sendMessage("Set volume to " + volume*100.0);
		if (currentDispatcher) {
			currentDispatcher.setVolume(volume);
		}
	}
}

function findVoiceChannel(m) {
	var guild = m.channel.guild;
	var members = guild.members;
	for (var channel of guild.channels) {
		channel = channel[1];
		if (channel.type == "voice"){
			var member = channel.members.find("id", m.author.id);
			if (member) {
				currentVoiceChannel = channel;
				break;
			}
		}
	}
}

function handleError(err) {
	console.log("Error! " + err);
	currentChannel.sendMessage("There was an error!");
}

// Video player controls

// Skips to next video if available.
function next(message) {
	if (!checkPermissions(message)){
		return;
	}
	if (videoQueue.length > 0) {
		stopCurrentVideo();
		nextInQueue();
	} else {
		currentChannel.sendMessage("There's no next video");
	}
}

// Stops playback.
// Just leaves current voice channel, and doesn't play the next video.
function stop(message) {
	if (!checkPermissions(message)){
		return;
	}
	if (currentVideo != null) {
		stopCurrentVideo();
	} else {
		currentChannel.sendMessage("There's currently no video being played");
	}
}

// Just clears the queue.
// Doesn't actually stop the current video.
function clear(message) {
	if (!checkPermissions(message)){
		return;
	}
	if (videoQueue.length > 0) {
		videoQueue = [];
		currentChannel.sendMessage("Successfully cleared the queue!");
	} else {
		currentChannel.sendMessage("The queue is empty!");
	}
}

//////////////////////////////////////////
// Code for playing youtube videos.
//////////////////////////////////////////

function processPlayParameters(message, parse) {
	if (parse == null || parse.length == 0) {
		handleError("There was an error with the parse: " + parse);
		return;
	}
	if (typeof parse != 'string') {
		parse = parse[parse.length - 1]
	}
	if (parse.match(url_regex)) { //we were passed a url (any url)
		// var video = VideoSaver.retrieveVideo(parse);
		// if (video != null) {
			// queueVideo(undefined, video, message);
		// } else {
			YoutubeVideo.getVideo(parse, message, queueVideo);
		// }
	} else { // We were passed a search query.
		YoutubeVideo.search(parse, (err, video_id) => {
			if (err) {
				handleError(err);
			} else {
				YoutubeVideo.getVideoFromId(video_id, message, queueVideo);
			}
		});
	}
}

function queueVideo(err, video, message) {
	//Video saver stuff.
	if (err) {
		handleError(err);
		return;
	} else {
		// VideoSaver.save(video);
		videoQueue.push(video);
		if (currentVideo == null) {
			nextInQueue();
		} else {
			currentChannel.sendMessage("Video was queued " + video.print() + " queued by " + message.author.username)
		}
	}
}

function nextInQueue() {
	if (videoQueue.length > 0) {
		video = videoQueue.shift(); //Pop the next video.
		play(video);
	} else {
		if (currentVoiceChannel) currentVoiceChannel.leave();
		currentVideo = null;
		currentChannel.sendMessage("No more videos in queue.");
	}
}

function play(video) {
	currentVideo = video;
	if (currentVoiceChannel != null) {
		currentStream = video.getStream();

		currentStream.on("error", (err) => {
			stopCurrentVideo();
			nextInQueue();
			handleError(err);
			return;
		});

		currentStream.on("end", () => {
			setTimeout(nextInQueue, 8000)
		});
		currentVoiceChannel.join().then(connection => {
			currentChannel.sendMessage("Now playing " + video.print());
			currentDispatcher = connection.playStream(currentStream, {volume: volume});
		}).catch(console.error);
	} else {
		currentVideo = null;
		currentChannel.sendMessage("Error, which voice channel do I join?!");
	}
}

function stopCurrentVideo() {
	currentVoiceChannel.leave();
	currentDispatcher = null;
	currentVideo = null;
}

bot.login(token);
