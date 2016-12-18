const ytdl = require('ytdl-core');
const url = require("url");
const http = require("http");
const youtube_url = "http://www.youtube.com/watch?v="
const youtube_api_url = "https://www.googleapis.com"
const youtube_api_path = "/youtube/v3/search"

module.exports = YoutubeVideo = function(video, info) {
  this.video = video;
  this.title = info.title;
  this.author = info.author;
  this.lengthSeconds = info.lengthSeconds || info.length_seconds;
}

YoutubeVideo.getInfoFromVideo = function(vid, m, callBack) {
  let requestUrl = youtube_url + vid;
  ytdl.getInfo(requestUrl, (err, info) => {
    if (err){
      callBack(err, undefined);
    }
    else {
      var video = new YoutubeVideo(vid, info);
      video.userId = m.author.id;
      video.containedVideo = info;
      callBack(undefined, video);
    }
  });
};

YoutubeVideo.prototype.search = function (query) {
  var options = {
    host: youtube_api_url,
    path: youtube_api_path + "?part=snippet+q=" + query,
  }
  http.request(options, function(res) {
    var data = "";
    response.on("data", function(chunk) {
      data += chunk;
    });
    response.on("end", function(chunk) {
      console.log(data);
    });
  });
};

YoutubeVideo.prototype.print = function () {
  return this.title + ' by ' + this.author;
}

YoutubeVideo.prototype.saveable = function () {
  return {
    vid: this.vid,
    title: this.title,
    author: this.author
  }
}

YoutubeVideo.prototype.getStream = function() {
  var options = {
      filter: (format) => format.container === "mp4",
      quality: "lowest",
  };

  return ytdl.downloadFromInfo(this.containedVideo, options);
}
