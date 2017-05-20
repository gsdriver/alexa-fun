//
// Entry point
//

'use strict';

const Alexa = require('alexa-sdk');
const CarSearch = require('./intents/CarSearch');
const Details = require('./intents/Details');

const APP_ID = 'amzn1.ask.skill.388f5d43-8dad-4b45-99e4-6b4618553866';

// Handlers for our skill
const handlers = {
  'NewSession': function() {
    if (this.event.request.type === 'IntentRequest') {
      this.emit(this.event.request.intent.name);
    } else {
      this.emit('LaunchRequest');
    }
  },
  'CarSearchIntent': CarSearch.handleIntent,
  'DetailsIntent': Details.handleIntent,
  'LaunchRequest': function() {
    this.emit(':ask', 'Welcome to Car Rentals Search. You can search for a car by providing a location, dates, and times ... Now, what can I help you with?',
      'You can search for a car by saying an airport location, and can also provide dates or times.');
  },
  'AMAZON.HelpIntent': function() {
    this.emit(':ask', 'You can search for a car by providing a location, dates, and times.',
      'You can search for a car by saying an airport location, and can also provide dates or times.');
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Goodbye');
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye');
  },
  'Unhandled': function() {
    this.emit(':ask', 'Sorry, I didn\'t get that. Try saying Help.', 'Try saying Help.');
  },
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);

  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
