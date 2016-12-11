const Discord = require("discord.js")
const url = require("url");
const YoutubeVideo = require("./youtube_video");
const VideoSaver = require("./video_saver");
const bot = new Discord.Client();
const token = require("./config").getToken();
const regex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/
const youtube_api_key = null; //TODO: Get a youtube api key.

var videoQueue = [];
var currentStream = null;
var currentVideo = null;
var lastVideo = null;
var currentChannel = null;
var currentVoiceChannel = null;
var volume = 0.25; //Default to 1 quarter

process.on("unhandledRejection", (reason, promise) => {
	console.log(reason);
	console.log(promise);
})

bot.on("ready", () => {
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
	if (message.content == "-commands") {
		currentChannel.sendMessage("**Commands** \n -play 'youtubelink' \n -next play the next video in queue if any. \n -stop stop the current video \n -vol 'vol' set the volume \n -vol print out the volume.")
	}
	if (message.content == "-matt meme" || message.content == "-mattmeme") {
		currentChannel.sendMessage("I'm sure of what I said, but I'm not sure why I said it. - Matt")
		//TODO: MP3 File.
	}
	if (message.content == "-mexican beep song") {
		playYoutubeVideoFromUrl("https://www.youtube.com/watch?v=x47NYUbtYb0", message);
	}
	if (message.content == "-sexy sax man") {
		playYoutubeVideoFromUrl("https://www.youtube.com/watch?v=GaoLU6zKaws", message);
	}
	if (message.content == "-next") {
		if (!checkPermissions(message)){
			return;
		}
		if (currentVideo != null && videoQueue.length > 0) {
			stopCurrentVideo();
		} else {
			currentChannel.sendMessage("There's no next video");
		}
	}
	if (message.content == "-stop") {
		if (!checkPermissions(message)){
			return;
		}
		if (currentVideo != null) {
			stopCurrentVideo();
		} else {
			currentChannel.sendMessage("There's currently no video being played");
		}
	}
	if (message.content.includes('-vol')) {
		if (!checkPermissions(message)){
			return;
		}
		var parse = message.content.match(/-vol (.+)/);
		if (parse != null) {
			parse = parse[1];
		} else {
			currentChannel.sendMessage("The current volume is " + volume*100.0);
			return;
		}
		parse = parseInt(parse)
		if (parse != null) {
			parse = parse/100.0; // User's input on a scale of 100-0, Discord uses 1-0
			volume = parse;
			if (currentVideo != null) {
				currentChannel.sendMessage("Set volume to " + parse*100.0 + " for the next video");
			} else {
				currentChannel.sendMessage("Set volume to " + parse*100.0);
			}
		}
	}
	if (message.content.match(/^-play/)) { //play youtubelink
		var parse = message.content.match(/-play (.+)/)[1];
		if (parse.match(regex)){
			playYoutubeVideoFromUrl(parse, message);
		} else {
			//TODO: search query once I get a youtube api key.
			currentChannel.sendMessage("Can't search for videos right now");
		}
	}
});

function checkGuildPermissions(message) {
	if (!message.guild.roles.find("name", "SlothMaster")) {
		currentChannel.sendMessage("There is no SlothMaster in this channel. The role will be made");
		currentChannel.guild.createRole({name: "SlothMaster"})
												.then(role => console.log("Created role: " + role))
												.catch(console.error);
	}
	return true;
}

function checkPermissions(message) {
	return message.author.roles.find("name", "SlothMaster");
}

function playYoutubeVideoFromUrl(url, message) {
	var video_query = parseYoutubeUrl(url);
	if(video_query == null) {
		currentChannel.sendMessage("There was an error with parsing this url");
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
		YoutubeVideo.getInfoFromVideo(video_query, m, (err, video) => {
			if (err) {
				handleError(err);
				return;
			} else {
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

function handleError(err) {
	console.log("Error! " + err);
	currentChannel.sendMessage("There was an error!");
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

bot.login(token);
