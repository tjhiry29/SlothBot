const Discord = require("discord.js")
const url = require("url");
const bot = new Discord.Client();

const YoutubeVideo = require("./youtube_video");
const VideoSaver = require("./video_saver");
const commands = require("./commands");
const config = require("./config");

const youtube_regex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/
var token = null;
var videoQueue = [];
var currentStream = null;
var currentVideo = null;
var lastVideo = null;
var currentChannel = null;
var currentVoiceChannel = null;
var volume = 0.25; //Default to 1 quarter
var registeredCommands = null;
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
				.register("play (yt|youtube)?", {params: 1}, processYoutubeParameters)
				.register("commands", {}, displayCommands)
				.register("(matt meme|mattmeme)", {}, mattMeme)
				.register("mexican beep song", {result: "https://www.youtube.com/watch?v=x47NYUbtYb0"}, processYoutubeParameters)
				.register("sexy sax man", {result: "https://www.youtube.com/watch?v=GaoLU6zKaws"}, processYoutubeParameters)
				.register("next", {}, next)
				.register("stop", {}, stop)
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
	currentChannel.sendMessage("**Commands** \n -play 'youtubelink' \n -next play the next video in queue if any. \n -stop stop the current video \n -vol 'vol' set the volume \n -vol print out the volume.")
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
		extra = currentVideo ? " for the next video" : ""
		currentChannel.sendMessage("Set volume to " + volume*100.0 + extra);
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

function next(message) {
	if (!checkPermissions(message)){
		return;
	}
	if (currentVideo != null && videoQueue.length > 0) {
		stopCurrentVideo();
	} else {
		currentChannel.sendMessage("There's no next video");
	}
}

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

//////////////////////////////////////////
// Code for playing youtube videos.
//////////////////////////////////////////
function processYoutubeParameters(message, parse) {
	if (parse == null || parse.length == 0) {
		handleError("There was an error with the parse:" + parse);
		return;
	}
	if (typeof parse != 'string') { //we can be passed a string
		parse = parse[parse.length - 1]; //get the result. should always be the last one.
	}
	if (parse.match(youtube_regex)){
		playYoutubeVideoFromUrl(parse, message);
	} else {
		var result = YoutubeVideo.search(parse, (err, vid) => {
			if (err) {
				bot.handleError(err);
			} else {
				queueVideo(vid, message); // Already got the video id
			}
		});
	}
}

function playYoutubeVideoFromUrl(url, message) {
	var video_query = parseYoutubeUrl(url);
	if(video_query == null) {
		bot.handleError("There was an error with parsing this url");
		return;
	}
	queueVideo(video_query, message);
}

function queueVideo(video_query, m) {
	var video = VideoSaver.retrieveVideo(video_query);
	if (video != null) {
		videoQueue.push(video);
		if (currentVideo == null){
			nextInQueue();
		} else {
			currentChannel.sendMessage("Video was queued " + video.print() + " queued by: " + m.author.username);
		}
	} else {
		YoutubeVideo.getVideo(video_query, m, (err, video) => {
			if (err) {
				handleError(err);
				return;
			} else {
				VideoSaver.save(video);
				videoQueue.push(video);
				// Start playing if no video.
				if (currentVideo == null){
					nextInQueue();
				} else {
					currentChannel.sendMessage("Video was queued " + video.print() + " queued by: " + m.author.username);
				}
			}
		});
	}
}

function parseYoutubeUrl(video_url) {
	video_url = video_url.trim();
	var parsed = url.parse(video_url, true);
	if (parsed.query.v) return parsed.query.v;
	return null; //Error case.
}

function nextInQueue() {
	if (videoQueue.length > 0) {
		video = videoQueue.shift(); //Pop the next video.
		play(video);
	} else {
		currentChannel.sendMessage("No more videos in queue.");
	}
}

function play(video) {
	currentVideo = video;
	if (currentVoiceChannel != null) {
		currentStream = video.getStream();

		currentStream.on("error", (err) => {
			stopCurrentVideo();
			handleError(err);
			return;
		});

		currentStream.on("end", () => {
			setTimeout(stopCurrentVideo, 8000)
		});
		currentVoiceChannel.join().then(connection => {
			currentChannel.sendMessage("Now playing " + video.print());
			connection.playStream(currentStream, {volume: volume});
		}).catch(console.error);
	} else {
		currentVideo = null;
		currentChannel.sendMessage("Error, which voice channel do I join?!");
	}
}

function stopCurrentVideo() {
	currentVoiceChannel.leave();

	currentVideo = null;
	nextInQueue();
}

bot.login(token);
