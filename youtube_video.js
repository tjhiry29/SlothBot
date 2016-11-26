const ytdl = require("ytdl-core");

module.exports = YoutubeVideo = function(video, info) {
    this.video = video;
    this.title = info.title;
    this.author = info.author;
}

YoutubeVideo.getInfoFromVid = function(vid, m, callBack) {
    var requestUrl = "http://www.youtube.com/watch?v=" + vid;
    ytdl.getInfo(requestUrl, (err, info) => {
        if (err){
            callBack(err, null);
        }
        else {
            var video = new YoutubeVideo(vid, info);
            video.userId = m.author.id;
            video.containedVideo = info;
            callBack(null, video);
        }
    });
};

YoutubeVideo.prototype.print = function () {
    return this.title + " by " + this.author;
};

YoutubeVideo.prototype.saveable = function () {
    return {
        vid: this.vid,
        title: this.title,
        author: this.author
    };
};

YoutubeVideo.prototype.getStream = function() {
    var options = {
        filter: (format) => format.container === "mp4",
        quality: "lowest",
    };

    return ytdl.downloadFromInfo(this.containedVideo, options);
};
