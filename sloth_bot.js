const Discord = require("discord.js")
const url = require("url");
const YoutubeVideo = require("./youtube_video");
const VideoSaver = require("./video_saver");
const bot = new Discord.Client();
const token = "MjUwNDIyMDcyOTkwMjM2Njcy.CxU8VQ.Nsv5rXv_iwPAkX98DggnkH9zfdQ";
const regex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/
const youtube_api_key = null; //TODO: Get a youtube api key.

var playQueue = [];
var currentStream = null;
var currentVideo = null;
var lastVideo = null;
var currentChannel = null;

//TODO: Install ffmpeg, and node-opus, then test.

bot.on("ready", () => {
	console.log("I am ready!");
});


bot.on("message", message => {
	currentChannel = message.channel;
	if (message.content == "ping") {
		currentChannel.sendMessage("pong");
	}
	if (message.content.includes('-play')) {
		parse = message.content.match(/-play (.+)/)[1];
		if (parse.match(regex)){
			//youtube link
			vid = parseYoutubeUrl(parse);

			if (vid == null) {
				currentChannel.sendMessage("There was an error with parsing this url");
			}

			queueVideo(vid);
		} else {
			//TODO: search query once I get a youtube api key.
			currentChannel.sendMessage("Can't search for videos right now");
		}
		console.log(parse);
		console.log(message.content);
	}
});

function queueVideo(video_url) {
	video = VideoSaver.retrieveVideo(video_url);
	if (video != null) {
		playQueue.push(video);
		if (currentVideo == null){
			nextInQueue();
		} else {
			currentChannel.sendMessage("Video was queued");
		}
	} else {
		YoutubeVideo.getInfoFromVid(video_url, m, (err, video) => {
			if (err) {
				handleError(err);
			} else {
				playQueue.push(video);
				// Start playing if no video.
				if (currentVideo == null){
					nextInQueue();
				} else {
					currentChannel.sendMessage("Video was queued");
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
	if (playQueue.length > 0) {
		next = playQueue.shift(); //Pop the next video.
		play(next);
	}
}

function play(video) {
	currentVideo = video;
	if (bot.internal.voiceConnection) {
		var connection = bot.internal.voiceConnection;
		currentStream = video.getStream();

		currentStream.on("error", (err) => {
			playStopped();
			handleError(err);
			return;
		});

		currentStream.on("end", () => setTimeout(playStopped(), 8000));
		connection.playRawStream(currentStream).then(intent => {
			//something.
			currentChannel.sendMessage("Playing " + video.print());
		});
	}
}

function playStopped() {
	if (client.interal.voiceConnection) client.interal.voiceConnection.stopPlaying();

	currentVideo = null;
	nextInQueue();
}

bot.login(token);
