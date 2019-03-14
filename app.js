'use strict';

const Homey = require('homey');

// This is an array with the known RSS XML feeds that can be found at https://www.nu.nl/rss/__category__
let categories = ['algemeen', 'economie', 'internet', 'sport', 'achterklap', 'opmerkelijk', 'muziek', 'dvd', 'film', 'boek', 'games', 'lifehacking', 'plugged', 'auto', 'wetenschap', 'gezondheid', 'laatste'];


class NUnlApp extends Homey.App {

	
	onInit() {
		this.log('NU.nl news app loaded.');
		this.initSpeech();
		
	}
	
	initSpeech() {
		// Fix for addressing the parent object in certain contexts below
		let object = this;
		
		// This events is called when your app is a possible candidate for speech input
		Homey.ManagerSpeechInput.on('speechEval', function(speech, callback) {
			callback(null, true);
		});
		
		// This code is run whenever a speech input was matched on this app and Homey triggers our app
		Homey.ManagerSpeechInput.on('speechMatch', (speech, onSpeechEvalData) => {
			this.log('Triggered by speech input.');
			
			// We check whether Homey also triggered on one of the known categories in the speech input triggers
			if (speech.matches && speech.matches.main && speech.matches.main.categoryWords) {
				this.getNewsItems(speech, speech.matches.main.categoryWords.value[0], 'title', 3); // TODO :IMPLEMENT SETTINGS
			} else {
				// If we were triggered without a news category, we have to ask the user to tell us which news category is wanted
				this.log('Category unknown, asking for category input.');
				speech.ask(Homey.__('whichCategory'), {}, function(error, result) {
					if (error) {
						return Homey.error(error);
					} else if (result == '') {
						return Homey.log('No category was provided through speech input, exiting...');
					} else {
						object.getNewsItems(speech, result, 'title', 3); // TODO :IMPLEMENT SETTINGS
					}
				});
			}
        });
		
	}
	
	// This function attempts to get news items from the RSS XML feed, process them, and pass them along to the speech output manager
	async getNewsItems(speechsession, category, mode, max) {
		// We make the input category lowercase in case the Homey speech engine provides us with capitals
		category = category.toLowerCase();
		
		// Check if the given category is in the array of known categories
		var n_category = categories.find(function (item) {
			return item == category.toLowerCase();
		});
		
		// If no known category was matched, we inform the user and abort processing
		if (!n_category) {
			this.log('Unknown category: '+category);
			speechsession.say(Homey.__('unknownCategory', {'category': category}));
			return;
		}
		
		// The category 'laatste' should be casted to an empty string for its RSS URL to be correct
		if (category == 'laatste') {
			category = '';
		}
		
		// Import necessary classes
		var https = require('https');
		var FeedMe = require('feedme');
		
		// Fix for addressing the parent object in certain contexts below
		let object = this;
		
		// Get the rss news feed from the internet
		this.log('Getting news items for category: '+category);
		https.get('https://www.nu.nl/rss/'+category, function(res) {
			var parser = new FeedMe();
			var items = [];
			
			// Whenever we find an item in the parsed xml, add it to the items array
			parser.on('item', function(item) {
				// We only add the item to the array if the max number of items has not been reached, or no max (=0) was set
				if (items.length < max || max == 0) items.push(item);
			});
			
			// When the entire feed was parsed, we continue to process the items array
			parser.on('end', function() {
				console.log('Number of news items found: '+items.length);
				// Make sure at least one news item was found
				if (items.length > 0) {
					// First, we tell the total number of news items we have found
					speechsession.say(Homey.__('foundNews', {'count': items.length}))
						.then(txt => {
							// Then we initiate to read the first news item in the array
							object.readNewsItem(speechsession, items, 0, mode);
						});
				} else {
					// If no news items at all have been found, we notify the user
					speechsession.say(Homey.__('noNews'));
				}
			});
			
			// Notify the user if any error occurs while parsing the xml rss feed
			parser.on('error', function(error) {
				speechsession.say(Homey.__('errorParsing'));
				console.error(error);
			});
			
			// Give the result to the parser
			res.pipe(parser);
		}).on('error', function(error) {
			// If we can't download the rss feed, we notify the user
			speechsession.say(Homey.__('errorDownloading'));
			console.error(error);
		});
	}

	// This function reads one news item, pauses and loops into the next news item, if any
	async readNewsItem(speechsession, items, index, mode) {
		// Fix for addressing the parent object in certain contexts below
		let object = this;
		
		// Make sure there is at least one more news item to loop into
		if (index < items.length) {
			// Read the title of the news item
			this.log('Reading a news item: '+items[index].title);
			speechsession.say(items[index].title)
				.then(txt => {
					// If we also need to read the description, we continue here
					if (mode == 'description') {
						// Read the description of the news item
						speechsession.say(items[index].description, function (err, success) {
							// Pause for a second and loop into the next news item
							setTimeout(function() {
								index ++;
								object.readNewsItem(speechsession, items, index, mode);
							}, 1000);
						});
					} else {
						// Pause for a second and loop into the next news item
						setTimeout(function() {
							index ++;
							object.readNewsItem(speechsession, items, index, mode);
						}, 1000);
					}
				});
		} else {
			// Make a log entry if we have reached the end of the news items
			this.log('No more news items to read.');
		}
	}
	
}

module.exports = NUnlApp;