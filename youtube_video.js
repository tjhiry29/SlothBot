const fs = require("fs");
const ytdl = require('youtube-dl');
const request = require("superagent");
const config = require("./config");

const youtube_url = "http://www.youtube.com/watch?v="
const youtube_api_url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="
const youtube_api_path = ""
let youtube_api_key = null;

module.exports = YoutubeVideo = function(info) {
  this.webpage_url = info.webpage_url
  this.info = info;
}

YoutubeVideo.setYoutubeApiKey = function(key) {
  youtube_api_key = key;
}

YoutubeVideo.getVideoFromId = function(video_id, m, callBack) {
  let requestUrl = youtube_url + video_id;
  this.getVideo(requestUrl, m, callBack);
}

YoutubeVideo.getVideo = function(url, m, callBack) {
  ytdl.getInfo(url, (err, info) => {
    if (err){
      callBack(err, undefined, m);
    }
    else {
      var video = new YoutubeVideo(info);
      callBack(undefined, video, m);
    }
  });
};

YoutubeVideo.search = function(query, callback) {
  if (youtube_api_key == null) {
    console.log("No youtube api key provided");
    callback("No youtube api key provided", undefined);
    return;
  }
  request(youtube_api_url + query + "&key=" + youtube_api_key, (error, response) => {
    if (!error && response.statusCode == 200) {
      var body = response.body;
      if (body.items.length == 0) {
        callback("No query results", undefined);
        return;
      }
      for (var item of body.items) {
        if (item.id.kind === "youtube#video") {
          callback(undefined, item.id.videoId);
          return;
        }
      }
    }
  });
};

YoutubeVideo.prototype.print = function () {
  // Nothing for now.
  return this.webpage_url;
}

YoutubeVideo.prototype.getStream = function() {
  var options = ["--format=bestaudio"]
  if (this.webpage_url) {
    var video = ytdl(this.webpage_url, options, {});
    return video;
  }
}