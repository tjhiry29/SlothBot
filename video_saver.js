let loki = require("lokijs");

let db = new loki("database.loki",
{
    autoload: true,
    autosave: true,
    autosaveInterval: 10000,
    autoloadCallback: setUpCollection,
});
let videos = null;

// Use lokijs to save stuff.

function setUpCollection() {
    videos = db.getCollection("videos");
    if (videos == null) {
        videos = db.addCollection("videos");
    }
};

exports.save = function(video) {
    if (videos == null) {
        setUpCollection();
    }

    videos.insert(video);
};

exports.retrieveVideo = function(video_query) {
    if (videos == null) {
        setUpCollection();
    }
    video = videos.find({video: video_query});
    if (video == null || video.length == 0) {
        return null;
    } else {
        return video;
    }
}

module.exports = exports;
