const ytdl = require('ytdl-core');
const url = require("url");
const request = require("superagent");
const youtube_url = "http://www.youtube.com/watch?v="
const youtube_api_url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="
const youtube_api_path = ""
const youtube_api_key = require("./config").getYoutubeKey();


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

YoutubeVideo.search = function (query) {
  request(youtube_api_url + query + "&key=" + youtube_api_key, (error, response) => {
    if (!error && response.statusCode == 200) {
      var body = response.body;
      if (body.items.length == 0) {
        return "No query results";
      }
      for (var item of body.items) {
        if (item.id.kind === "youtube#video") {
          var vid = item.id.videoId;
          return vid;
        }
      }
    }

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
