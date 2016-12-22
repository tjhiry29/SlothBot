let discord_token = "";
let youtube_api_key = "";
let sound_cloud_client_id = "";

exports.setSoundCloudClientId = function(key) {
	sound_cloud_api_key = key;
}

exports.setYoutubeApiKey = function(key) {
    youtube_api_key = key;
}

exports.setToken = function(token) {
    discord_token = token;
}

exports.getToken = function() {
    return discord_token;
}

exports.getYoutubeKey = function() {
    return youtube_api_key;
}

exports.getSoundCloudApiKey = function() {
	return sound_cloud_api_key;
}

exports.getSoundCloudClientId = function() {
	return sound_cloud_client_id
}

module.exports = exports;
