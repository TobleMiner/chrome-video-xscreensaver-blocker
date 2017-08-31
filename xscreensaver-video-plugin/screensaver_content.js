"use strict";

let screensaverChannel = chrome.runtime.connect({name: 'screensaver_channel'});

// Global video element id. Acts as a tab-level uniqe id
let videoId = 0;

//$$('video').forEach(function(video) {
let videoTags = document.getElementsByTagName('video');
for(let i = 0; i < videoTags.length; i++)
{
	let video = videoTags[i];
	screensaverChannel.postMessage({type: "register", videoId: videoId});
	video.addEventListener('play', function(video) {
		screensaverChannel.postMessage({type: "play",
			videoId: videoId, timestamp: Date.now()});
	});
	video.addEventListener('pause', function(video) {
		screensaverChannel.postMessage({type: "pause",
			videoId: videoId, timestamp: Date.now()});
	});
	videoId++;
}
//});
