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

//TODO: Install ffmpeg, and node-opus, then test.

process.on("unhandledRejection", (reason, promise) => {
	console.log(reason);
	console.log(promise);
})

bot.on("ready", () => {
	console.log("I am ready!");
});

bot.on("message", message => {
	currentChannel = message.channel;
	if (message.content == "ping") {
		currentChannel.sendMessage("pong");
	}
	if (message.content.includes("-stop")) {
		if (currentVideo != null) {
			stopCurrentVideo();
		} else {
			currentChannel.sendMessage("There's currently no video being played");
		}
	}
	if (message.content.includes('-play')) { //play youtubelink
		parse = message.content.match(/-play (.+)/)[1];
		if (parse.match(regex)){
			//youtube link
			video_query = parseYoutubeUrl(parse);

			if (video_query == null) {
				currentChannel.sendMessage("There was an error with parsing this url");
			}

			queueVideo(video_query);
		} else {
			//TODO: search query once I get a youtube api key.
			currentChannel.sendMessage("Can't search for videos right now");
		}
		console.log(parse);
		console.log(message.content);
	}
});

function queueVideo(video_query) {
	video = VideoSaver.retrieveVideo(video_query);
	if (video != null) {
		videoQueue.push(video);
		if (currentVideo == null){
			nextInQueue();
		} else {
			currentChannel.sendMessage("Video was queued");
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
	if (videoQueue.length > 0) {
		video = videoQueue.shift(); //Pop the next video.
		play(video);
	}
}

function play(video) {
	currentVideo = video;
	if (bot.internal.voiceConnection) {
		var connection = bot.internal.voiceConnection;
		currentStream = video.getStream();

		currentStream.on("error", (err) => {
			stopCurrentVideo();
			handleError(err);
			return;
		});

		currentStream.on("end", () => {
			setTimeout(stopCurrentVideo, 8000)
		});
		connection.playRawStream(currentStream).then(intent => {
			//something.
			currentChannel.sendMessage("Playing " + currentVideo.print());
		});
	}
}

function stopCurrentVideo() {
	if (client.interal.voiceConnection) client.interal.voiceConnection.stopPlaying();

	currentVideo = null;
	nextInQueue();
}

bot.login(token);
