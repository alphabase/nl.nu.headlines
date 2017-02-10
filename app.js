'use strict';

// Homey init function, nothing to do here
function init() {
}

// This code is run whenever the action card is triggered in the Homey flow editor
Homey.manager('flow').on('action.nl_nu_read_news', function(callback, args) {
	
	// Import necessary classes
	var http = require('http');
	var FeedMe = require('feedme');
	
	// Get the rss news feed from the internet
	http.get('http://www.nu.nl/rss/'+args.category, function(res) {
		var parser = new FeedMe();
		var items = [];
		
		// Whenever we find an item in the parsed xml, add it to the items array
		parser.on('item', function(item) {
			// We only add the item to the array if the max number of items has not been reached, or no max (=0) was set
			if (items.length < args.max || args.max == 0) items.push(item);
		});
		
		// When the entire feed was parsed, we continue to process the items array
		parser.on('end', function() {
			// Make sure at least one news item was found
			if (items.length > 0) {
				// First, we tell the total number of news items we have found
				Homey.manager('speech-output').say(__('foundNews', {'count': items.length}));
				// Then we initiate to read the first news item in the array
				readNewsItem(items, 0, args.content);
			} else {
				// If no news items at all have been found, we notify the user
				Homey.manager('speech-output').say(__('noNews'));
			}
		});
		
		// Notify the user if any error occurs while parsing the xml rss feed
		parser.on('error', function(error) {
			Homey.manager('speech-output').say(__('errorParsing'));
			console.error(error);
		});
		
		// Give the result to the parser
		res.pipe(parser);
	}).on('error', function(error) {
		// If we can't download the rss feed, we notify the user
		Homey.manager('speech-output').say(__('errorDownloading'));
		console.error(error);
	});
	callback(null, true);
});

// This function reads one news item, pauses and loops into the next news item, if any
function readNewsItem(items, index, mode) {
	// Make sure there is at least one more news item to loop into
	if (index < items.length) {
		// Read the title of the news item
		Homey.manager('speech-output').say(items[index].title, function (err, success) {
			// If we also need to read the description, we continue here
			if (mode == 'description') {
				// Read the description of the news item
				Homey.manager('speech-output').say(items[index].description, function (err, success) {
					// Pause for a second and loop into the next news item
					setTimeout(function() {
						index ++;
						readNewsItem(items, index, mode);
					}, 1000);
				});
			} else {
				// Pause for a second and loop into the next news item
				setTimeout(function() {
					index ++;
					readNewsItem(items, index, mode);
				}, 1000);
			}
		});
	} else {
		// Make a log entry if we have reached the end of the news items
		Homey.log('Done reading news items.');
	}
}

module.exports.init = init;
