"use stricit";

var videosByTab = {};

var numVideosPlaying = 0;

const SCREENSAVER_PORT = 23433;

function register_video(tab, videoId)
{
	console.assert("id" in tab);

	if(! (tab.id in videosByTab))
		videosByTab[tab.id] = {};

	if(! (videoId in videosByTab[tab.id]))
		videosByTab[tab.id][videoId] = {playing: false, lastUpdate: 0};
}

function get_video(tab, videoId)
{
	console.assert("id" in tab);

	if((! (tab.id in videosByTab)) || (! (videoId in videosByTab[tab.id])))
		register_video(tab, videoId);

	return videosByTab[tab.id][videoId];
}

function sendScreensaverRequest(blockState)
{
	let req = new XMLHttpRequest()
	req.open("GET", `http://127.0.0.1:${SCREENSAVER_PORT}/?block=${blockState}`);
	req.send();
}

function update_global_play_state()
{
	console.assert(numVideosPlaying >= 0);

	if(numVideosPlaying == 0)
	{
		console.log("Screensaver unblocked");
		sendScreensaverRequest(false);
	}
	else
	{
		console.log("Screensaver blocked");
		sendScreensaverRequest(true);
	}
}

function set_video_play_state(tab, videoId, timestamp, state)
{
	let video = get_video(tab, videoId);

	if(video.lastUpdate > timestamp)
		return;

	video.lastUpdate = timestamp;

	if(state && !video.playing)
		numVideosPlaying++;

	else if(video.playing && !state)
		numVideosPlaying--;

	if(video.playing != state)
		update_global_play_state();

	video.playing = state;
}

function play_video(tab, videoId, timestamp)
{
	set_video_play_state(tab, videoId, timestamp, true);
}

function pause_video(tab, videoId, timestamp)
{
	set_video_play_state(tab, videoId, timestamp, false);
}

chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name == "screensaver_channel");

	console.log("Content script connected");

	port.onMessage.addListener(function(msg, sender, sendResponse) {
		sender = sender.sender;
		console.assert("tab" in sender);

		console.assert("type" in msg);
		console.assert("videoId" in msg);
		switch(msg.type) {
			case("register"):
				register_video(sender.tab, msg.videoId);
				break;
			case("play"):
				console.assert("timestamp" in msg);
				play_video(sender.tab, msg.videoId, msg.timestamp);
				break;
			case("pause"):
				console.assert("timestamp" in msg);
				pause_video(sender.tab, msg.videoId, msg.timestamp);
		}
	});
});

chrome.tabs.onRemoved.addListener(function(id, tabInfo) {
	if(! (id in videosByTab))
		return;

	for(let videoId in videosByTab[id])
	{
		let video = videosByTab[id][videoId];
		if(video.playing)
			numVideosPlaying--;
	}

	videosByTab[id] = undefined;
	update_global_play_state();
});
