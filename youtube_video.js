const fs = require("fs");
const ytdl = require('youtube-dl');
const request = require("superagent");
const config = require("./config");

const youtube_url = "http://www.youtube.com/watch?v="
const youtube_api_url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="
const youtube_api_path = ""
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
      console.log(info);
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
  var format = ["--format=bestaudio"]
  return ytdl(info.webpage_url, format, {start: 0}) //returns a stream.
}

YoutubeVideo.downloadVideo = function(info, options) {
  var output = info.title + ".mp4";
 
  var downloaded = 0;
  if (fs.existsSync(output)) {
    downloaded = fs.statSync(output).size;
  }
  if (output == "undefined.mp4" && downloaded > 0) {
    this.deleteVideo(output);
  }
  let video = ytdl(info.webpage_url,
    ['--format=bestaudio'],
    { start: downloaded});
  // Will be called when the download starts.
  video.on('info', function(info) {
    console.log('Download started');
    console.log('filename: ' + info._filename);
    // info.size will be the amount to download, add
    var total = info.size + downloaded;
    console.log('size: ' + total);

    if (downloaded > 0) {
      // size will be the amount already downloaded
      console.log('resuming from: ' + downloaded);

      // display the remaining bytes to download
      console.log('remaining bytes: ' + info.size);
    }
  });

  video.pipe(fs.createWriteStream(output, { flags: 'a' }));

  // Will be called if download was already completed and there is nothing more to download.
  video.on('complete', function complete(info) {
    'use strict';
    console.log('filename: ' + info._filename + ' already downloaded.');
  });

  video.on('end', function() {
    console.log('finished downloading!');
  });
  this.file_name = output;
}

YoutubeVideo.deleteVideo = function(file_name) {
  if(fs.statSync(file_name)) {
    fs.unlinkSync(file_name);
  }
}