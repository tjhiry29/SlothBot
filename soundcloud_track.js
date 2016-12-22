const SC = require("soundcloud");
const config = require ("./config");
let sound_cloud_client_id = "";

exports = SoundcloudTrack = function() {

};

SoundcloudTrack.setSoundCloudClientId = function(id) {
	sound_cloud_client_id = id;
	if (id != "") {
		SC.init({
			clent_id: config.getSoundCloudClientId(),
		});
	}
}

SoundcloudTrack.search = function(query, callback) {
	if (!checkClientId(callback)) return;
	SC.get("/tracks", { //search on titles.
		title: query
	}).then(function(tracks) {
		console.log(tracks);
	});
};

SoundcloudTrack.checkClientId = function(callBack) {
	if (sound_cloud_client_id == "") {
		console.log("No sound cloud client id available");
		callBack("No sound cloud client id available", undefined);
		return false;
	}
	return true;
}
