# NU.nl news headlines

This app makes Homey read the headlines of the Dutch news site NU.nl.
The app supports both a flow action card as general speech input from the Homey microphone. If the app was triggered through speed input from a smartphone, communication will continue through that device instead of the default internal Homey microphone and speaker.

If no news items have been found in the news feed, Homey will inform you about this.
Homey pauses for a second between reading two news items.

## News categories

- algemeen
- economie
- internet
- sport
- achterklap
- opmerkelijk
- muziek
- dvd
- film
- boek
- games
- lifehacking
- plugged
- auto
- wetenschap
- gezondheid

## Speech input

The app can be triggered by using one of the news-related trigger words, optionally combined with one of the news category titles.
If no news category was found in the speech input, Homey will ask you for it.

The supported news-related trigger words are, in English:
- news
- news items
- latest news

The supported news-related trigger words are, in Dutch:
- nieuws
- nieuwsberichten
- laatste nieuws

The news category titles have not been translated into English.
If the app is triggered by speech input, the default content to read is only news titles, not descriptions. Also, all news items in the RSS feed are read without limitations.

### Example speech input

**English**
- Read me the news
- Is there any news?
- What is the news in the sport section?
- Would you please read me news from the category games?

**Dutch**
- Lees het nieuws voor
- Is er nog nieuws?
- Wat is het nieuws in de sport categorie?
- Wil je me alsjeblieft het nieuws uit de categorie games voorlezen?

## Flow action card

The flow action card has three settings:

- Category: Select the news category of which you would like to hear the headlines.
- Content: Reads either only the headline titles or also the descriptions.
- Max items: Limits the number of headlines to read from the news feed. Use 0 for unlimited.
