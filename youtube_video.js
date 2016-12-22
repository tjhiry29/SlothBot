const ytdl = require('ytdl-core');
const url = require("url");
const request = require("superagent");
const youtube_url = "http://www.youtube.com/watch?v="
const youtube_api_url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="
const youtube_api_path = ""
const config = require("./config");
let youtube_api_key = null;

module.exports = YoutubeVideo = function(video, info) {
  this.video = video;
  this.title = info.title;
  this.author = info.author;
  this.lengthSeconds = info.lengthSeconds || info.length_seconds;
  this.info = info;
}

YoutubeVideo.setYoutubeApiKey = function(key) {
  youtube_api_key = key;
}

YoutubeVideo.getVideo = function(vid, m, callBack) {
  let requestUrl = youtube_url + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err){
      callBack(err, undefined);
    }
    else {
      var video = new YoutubeVideo(vid, info);
      video.userId = m.author.id;
      callBack(undefined, video);
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
  return this.title + ' by ' + this.author;
}

YoutubeVideo.prototype.getStream = function() {
  var options = {
      filter: (format) => format.container === "mp4",
      quality: "lowest",
  };

  return ytdl.downloadFromInfo(this.info, options);
}
