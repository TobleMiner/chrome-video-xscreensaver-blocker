"use strict";

let screensaverChannel = chrome.runtime.connect({name: 'screensaver_channel'});

// Global video element id. Acts as a tab-level uniqe id
let videoId = 0;

let videos = [];

function sendPlayState(state, videoId) {
	screensaverChannel.postMessage({type: state ? "play" : "pause",
		videoId: videoId, timestamp: Date.now()});
}

//$$('video').forEach(function(video) {
function collectVideoTags()
{
	let videoTags = document.getElementsByTagName('video');
	for(let i = 0; i < videoTags.length; i++)
	{
		let video = videoTags[i];
		if(videos.indexOf(video) !== -1)
			continue;

		screensaverChannel.postMessage({type: "register", videoId: videoId});

		if(!video.paused)
			sendPlayState(true, videoId);

		video.addEventListener('play', sendPlayState.bind(this, true, videoId));
		video.addEventListener('pause', sendPlayState.bind(this, false, videoId));

		window.addEventListener('unload', sendPlayState.bind(this, false, videoId));

		videoId++;
		videos.push(video);
	}
}
//});

document.addEventListener('DOMContentLoaded', collectVideoTags);
window.addEventListener('load', collectVideoTags);

collectVideoTags();

window.setInterval(collectVideoTags, 10000);
