/*
 * Calls EWSCar API to perform a search
 *
 * Returns results in a JSON array with the following fields:
 *
 *      price, currency, model, class, supplier, imageURL, detailsURL
 *
 * The idea is that this file can be replaced with one that calls a different API
 * so long as it maps its results to a JSON array that matches the same format
 */

'use strict';

const http = require('http');
const config = require('./config');

module.exports = {
  // Does a Car Search
  DoCarSearch: function(params, callback) {
    getCarResults(params, (error, ewsResults) => {
      // Now that we have results, we need to turn the results into a string
      if (error) {
        callback(error, null);
      } else {
        // Pull out
        const carResults = [];

        // Return only the fields we care about
        ewsResults.CarInfoList.CarInfo.forEach((car) => {
          const newCar = {};

          newCar.price = car.Price.TotalRate.Value;
          newCar.currency = car.Price.TotalRate.Currency;
          newCar.model = car.CarMakeModel;
          newCar.class = car.CarClass;
          newCar.supplier = car.SupplierName;
          newCar.imageURL = car.ThumbnailUrl;
          newCar.detailsURL = car.DetailsUrl;

          carResults.push(newCar);
        });

        callback(null, carResults);
      }
    });
  },
};

/*
 * Internal functions
 */
function formatDate(date) {
  let retval = '';

  // Convert to ISO-8601 format, then remove seconds
  retval = date.toISOString();
  retval = retval.substring(0, retval.lastIndexOf(':'));
  return retval;
}

function getCarResults(params, callback) {
  // Build the request
  let queryString = '?key=' + config.EWSkey;

  // Add in parameters
  queryString += '&pickuplocation=' + params.pickuplocation;
  queryString += '&pickupdate=' + formatDate(params.pickupdate);
  queryString += '&dropoffdate=' + formatDate(params.dropoffdate);
  queryString += '&sort=price&limit=5&format=json';

  http.get(config.serviceEndpoint + queryString, (res) => {
    if (res.statusCode == 200) {
      // Great, we should have a game!
      let fulltext = '';

      res.on('data', (data) => {
        fulltext += data;
      });

      res.on('end', () => {
        callback(null, JSON.parse(fulltext));
      });
    } else {
      // Sorry, there was an error calling the HTTP endpoint
      callback('Unable to call endpoint', null);
    }
  }).on('error', (e) => {
    callback('Communications error: ' + e.message, null);
  });
}
