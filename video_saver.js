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

exports.save = function(url) {
    if (videos == null) {
        setUpCollection();
    }
    if (this.retrieveVideo(url) == null) {
        videos.insert(url);
    }
};

exports.retrieveVideo = function(url) {
    if (videos == null) {
        setUpCollection();
    }
    video = videos.find({webpage_url: url});
    if (video == null || video.length == 0) {
        return null;
    } else {
        return video[0]; //return first element.
    }
}

module.exports = exports;
