//
// Entry point
//

'use strict';

const EWSCar = require('../api/CRCar'); //require('./api/EWSCar');
const SO = require('../SpeechOutput');

module.exports = {
  handleIntent: function() {
    const idSlot = this.event.request.intent.slots.CarID;

    if (!idSlot || !idSlot.value) {
      this.emit(':ask', 'I\'m sorry, I didn\'t hear a number of the car you wanted details about.', 'What else can I help with?');
      return;
    }

    // They need to have a list to read details from
    if (!this.event.session.attributes || !this.event.session.attributes.carList) {
      // I need a prior search to work properly
      this.emit(':ask', 'You need to get results before asking for car details', 'What else can I help with?');
    } else {
      SO.readCarDetails(this.event.session.attributes.carList, idSlot.value, (error, result, cardText) => {
        if (error) {
          this.emit(':ask', error, 'What else can I help with?');
        } else {
          if (cardText) {
            this.emit(':tellWithCard', result, 'Car Details', cardText);
          } else {
            this.emit(':tell', result);
          }
        }
      });
    }
  },
};
