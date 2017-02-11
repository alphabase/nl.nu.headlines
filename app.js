'use strict';

// This is an array with the known RSS XML feeds that can be found at http://www.nu.nl/rss/__category__
var categories = ['algemeen', 'economie', 'internet', 'sport', 'achterklap', 'opmerkelijk', 'muziek', 'dvd', 'film', 'boek', 'games', 'lifehacking', 'plugged', 'auto', 'wetenschap', 'gezondheid'];

// Homey init function, nothing to do here
function init() {
	Homey.log('NU.nl news app loaded.');
}

// This code is run whenever the action card is triggered in the Homey flow editor
Homey.manager('flow').on('action.nl_nu_read_news', function(callback, args) {
	getNewsItems(args.category, args.content, args.max);
	callback(null, true);
});

// This code is run whenever a speech input was matched on this app and Homey triggers our app
Homey.manager('speech-input').on('speech', function(speech, callback) {
	Homey.log('Triggered by speech input.');
	// We check whether Homey also triggered on one of the known categories in the speech input triggers
	var category = speech.triggers.find(function (item) {
		return item.id == 'news_category';
	});
	// If we were indeed triggered on a news category, we have plenty of information to continue and fetch news items
	if (category) {
		getNewsItems(category.text, 'title', 0);
	} else {
		// If we were not triggered with a news category, we have to ask the user to tell us which news category is wanted
		Homey.log('Category unknown, asking for category input.');
		speech.ask(__('whichCategory'), function (err, result) {
			if (err) return Homey.error(err);
			getNewsItems(result, 'title', 0);
		});
	}
	callback(null, true);
});

// This function attempts to get news items from the RSS XML feed, process them, and pass them along to the speech output manager
function getNewsItems(category, mode, max) {
	// Check if the given category is in the array of known categories
	var n_category = categories.find(function (item) {
		return item == category;
	});
	// If no known category was matched, we inform the user and abort processing
	if (!n_category) {
		Homey.log('Unknown category: '+category);
		Homey.manager('speech-output').say(__('unknownCategory', {'category': category}));
		return;
	}
	
	// Import necessary classes
	var http = require('http');
	var FeedMe = require('feedme');
	
	// Get the rss news feed from the internet
	Homey.log('Getting news items for category: '+category);
	http.get('http://www.nu.nl/rss/'+category, function(res) {
		var parser = new FeedMe();
		var items = [];
		
		// Whenever we find an item in the parsed xml, add it to the items array
		parser.on('item', function(item) {
			// We only add the item to the array if the max number of items has not been reached, or no max (=0) was set
			if (items.length < max || max == 0) items.push(item);
		});
		
		// When the entire feed was parsed, we continue to process the items array
		parser.on('end', function() {
			Homey.log('Number of news items found: '+items.length);
			// Make sure at least one news item was found
			if (items.length > 0) {
				// First, we tell the total number of news items we have found
				Homey.manager('speech-output').say(__('foundNews', {'count': items.length}));
				// Then we initiate to read the first news item in the array
				readNewsItem(items, 0, mode);
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
}

// This function reads one news item, pauses and loops into the next news item, if any
function readNewsItem(items, index, mode) {
	// Make sure there is at least one more news item to loop into
	if (index < items.length) {
		// Read the title of the news item
		Homey.log('Reading a news item: '+items[index].title);
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
		Homey.log('No more news items to read.');
	}
}

module.exports.init = init;
