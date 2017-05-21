//
// Performs a car search
//

'use strict';

const http = require('http');
const EWSCar = require('../api/CRCapri'); // require('../api/EWSCar');
const SO = require('../SpeechOutput');

module.exports = {
  handleIntent: function() {
    // Build the car search
    buildCarSearchParams(this.event.request.intent, (error, params) => {
      if (error) {
        this.emit(':ask', error, 'What else can I help with?');
      } else {
        // Let's get the car search results from EWS
        EWSCar.doCarSearch(params, (speechError, carList) => {
          if (speechError) {
            this.emit(':ask', speechError, 'What else can I help with?');
          } else {
            const speechResponse = SO.getCarResultText(params, carList);

            this.attributes['carList'] = carList;
            this.emit(':ask', speechResponse, 'Say the number of the car you would like more details about.');
          }
        });
      }
    });
  },
};

function getAlexaDate(dateValue) {
  let myDate = dateValue;
  let date;
  const now = new Date(Date.now());

  // This will be an ISO-8601 date, though it may have special values that we'll have to account for
  // We check for these special cases as outlined at
  // https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit
  // /docs/alexa-skills-kit-interaction-model-reference

  // A season as follows:  winter: WI, spring: SP, summer: SU, fall: FA
  const seasonMapping = {'WI': 1, 'SP': 4, 'SU': 7, 'FA': 10};
  if (seasonMapping[myDate]) {
    // Make it the 15th day of this month
    date = new Date(now.getFullYear(), seasonMapping[myDate], 15);
    if (date < now) {
      // Bump to next year
      date.setFullYear(date.getFullYear() + 1);
    }

    return date;
  }

  // Just a week will have a week number (2015-W49)
  if (myDate.indexOf('W') > -1) {
    const segments = myDate.split('-');
    const weekNumber = parseInt(segments[1].slice(1));

    // Figure out the week number - then we'll just use the fact that Jan 4 is always week 1
    date = new Date(segments[0], 0, 4);
    date.setUTCDate(date.getUTCDate() + 7 * (weekNumber - 1));

    // a weekend for a specific week will end in WE (2015-W49-WE)
    if ((segments.length == 3) && (segments[2] == 'WE')) {
      // Mark this as Saturday (adding to the current date)
      date.setUTCDate(date.getUTCDate() + (6 - date.getUTCDay()));
    }

    return date;
  }

  // it could also be a decade (201X)
  if (myDate.indexOf('X') > -1) {
    // We don't support this
    return null;
  }

  // the month or day may be missing (e.g. 2015-12 or 2016)
  const segments = myDate.split('-');
  if (segments.length == 1) {
    // Just a year?
    myDate += '-01-15';
  } else if (segments.length == 2) {
    // No day?
    myDate += '-15';
  }

  // OK, maybe it's just a date
  const base = new Date(myDate);
  date = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
  return date;
}

function getIntentDate(dateSlot, timeSlot, baseDate, offsetDays) {
  let dat;

  // Is there a date in the slot?
  if (dateSlot && dateSlot.value) {
    // Use this one - round time up to the nearest 30 minutes
    dat = getAlexaDate(dateSlot.value);
    if (dat) {
      // Do I have a time?
      if (timeSlot && timeSlot.value) {
        // Can be one of these special values - night: NI, morning: MO, afternoon: AF, evening: EV
        const timeMapping = {'ni': 21, 'mo': 9, 'af': 14, 'ev': 17};

        if (timeMapping[timeSlot.value.toLowerCase()]) {
            dat.setUTCHours(timeMapping[timeSlot.value.toLowerCase()], 0);
        } else {
            // Split it by the colon
            const times = timeSlot.value.split(':');

            if ((times.length >= 2) && !isNaN(parseInt(times[0])) && !isNaN(parseInt(times[1]))) {
                dat.setUTCHours(parseInt(times[0]), parseInt(times[1]));
            } else {
                // Just go with 10:00 AM
                dat.setUTCHours(10, 0);
            }
        }
      } else {
        // Go with 10:00 AM
        dat.setUTCHours(10, 0);
      }

      // If this date is in the past, null it out so we go with the default
      if (dat < baseDate) {
        dat = null;
      } else if ((dat.getUTCMinutes() != 0) && (dat.getUTCMinutes() != 30)) {
        // Snap to 30 minutes
        if (dat.getUTCMinutes() < 30) {
          dat.setUTCMinutes(30);
        } else {
          dat.setUTCHours(dat.getUTCHours() + 1, 0);
        }
      }
    }
  }

  if (!dat) {
    // No date, use the baseDate and offset to set the date
    const base = new Date(baseDate);
    dat = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
    dat.setDate(dat.getDate() + offsetDays);

    // Time is set to 10:00 AM
    dat.setUTCHours(10, 0);
  }

  return dat;
}

function buildCarSearchParams(intent, callback) {
  const searchParams = {};

  // If we have a city, then get the TLA from it
  if (!intent.slots.Location || !intent.slots.Location.value) {
    callback('You need to specify a city for your car.', null);
  } else {
    getAirportCode(intent.slots.Location.value, (err, airportCode) => {
      if (!airportCode) {
        callback(intent.slots.Location.value + ' is not a city I can search for a car.', null);
      } else {
        searchParams.pickuplocation = airportCode;
        searchParams.pickupcity = intent.slots.Location.value;

        // Set the dates - by default (if dates are not set),
        // this will be 7 days from now for 2 days
        searchParams.pickupdate = getIntentDate(intent.slots.PickUpDate,
          intent.slots.PickUpTime, Date.now(), 7);
        searchParams.dropoffdate = getIntentDate(intent.slots.DropOffDate,
          intent.slots.DropOffTime, searchParams.pickupdate, 2);

        callback(null, searchParams);
      }
    });
  }
}

//
// Calls suggest esrvice to resolve city
//
function getAirportCode(location, callback) {
  const url = `http://suggestch.expedia.com/api/v4/resolve/${encodeURIComponent(location)}?regiontype=airport|city|multicity|poi|metrocode|neighborhood&format=json&client=1`;

  http.get(url, (res) => {
    if (res.statusCode == 200) {
      let fulltext = '';

      res.on('data', (data) => {
        fulltext += data;
      });

      res.on('end', () => {
        const airports = JSON.parse(fulltext);
        if (!airports.sr) {
          callback('No airport near ' + location, null);
        } else {
          console.log('Airport for ' + location + ' is ' + airports.sr[0].hierarchyInfo.airport.airportCode);
          callback(null, airports.sr[0].hierarchyInfo.airport.airportCode);
        }
      });
    } else {
      // Sorry, there was an error calling the HTTP endpoint
      callback('Unable to call endpoint', null);
    }
  }).on('error', (e) => {
    callback('Communications error: ' + e.message, null);
  });
}
