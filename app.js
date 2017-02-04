"use strict";

function init() {
	
	Homey.manager('flow').on('action.nl_nu_read_news', function(callback, args) {
		
		var http = require('http');
		var FeedMe = require('feedme');
		
		http.get('http://www.nu.nl/rss/'+args.category, function(res) {
			var parser = new FeedMe();
			var items = [];
			
			parser.on('item', function(item) {
				if (items.length < args.max || args.max == 0) items.push(item);
			});
			
			parser.on('end', function() {
				if (items.length > 0) {
					Homey.manager('speech-output').say(__('foundNews', {'count': items.length}));
					for (var i = 0, length = items.length; i < length; i++) {
						Homey.manager('speech-output').say(items[i].title);
						if (args.content == 'description') Homey.manager('speech-output').say(items[i].description);
					}
				} else {
					Homey.manager('speech-output').say(__('noNews'));
				}
			});
			
			parser.on('error', function(error) {
				Homey.manager('speech-output').say(__('errorParsing'));
			});
			
			res.pipe(parser);
		}).on('error', function(e) {
			Homey.manager('speech-output').say(__('errorDownloading'));
		});
		callback(null, true);
	});
}

module.exports.init = init;
