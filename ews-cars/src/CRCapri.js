/*
 * Calls CarRentals Capri API to perform a search
 *
 * Returns results in a JSON array with the following fields:
 *
 *      price, currency, model, class, supplier, imageURL, detailsURL
 *
 * The idea is that this file can be replaced with one that calls a different API
 * so long as it maps its results to a JSON array that matches the same format
 *
 */

'use strict';

const http = require('http');
const querystring = require('querystring');

module.exports = {
  // Does a Car Search
  doCarSearch: function(params, callback) {
    getCarResults(params, (error, CRResults) => {
      // Now that we have results, we need to turn the results into a string
      if (error) {
        callback(error, null);
      } else {
        const carResults = [];
        const classMapping = {M: 'Mini', N: 'Mini Elite', E: 'Economy', H: 'Economy Elite',
                            C: 'Compact', D: 'Compact Elite', I: 'Intermediate', J: 'Intermediate Elite',
                            S: 'Standard', R: 'Standard Elite', F: 'Fullsize', G: 'Fullsize Elite',
                            P: 'Premium', U: 'Premium Elite', L: 'Luxury', W: 'Luxury Elite',
                            O: 'Oversize', X: 'Special'};

        // Return only the fields we care about
        CRResults.products.forEach((product) => {
          const newCar = {};
          const car = getCar(CRResults.cars, product.carId);
          const supplier = getSupplier(CRResults.suppliers, product.supplierId);

          if (car && supplier) {
            newCar.supplier = supplier.name;
            newCar.currency = supplier.currency;
            newCar.price = product.price.amount.total;
            newCar.model = car.model;
            newCar.class = classMapping[car.acriss[0]];
            newCar.imageURL = car.image;

            carResults.push(newCar);
          }
        });

        // OK, sort by price and return the five cheapest
        carResults.sort((a, b) => (a.price - b.price));
        callback(null, carResults.slice(0, 5));
      }
    });
  },
};

/*
 * Internal functions
 */
function getSupplier(suppliers, id) {
  let mySupplier;

  suppliers.forEach((supplier) => {
    if (id == supplier.id) {
      mySupplier = supplier;
    }
  });

  return mySupplier;
}

function getCar(cars, id) {
  let myCar;

  cars.forEach((car) => {
    if (car.id == id) {
      myCar = car;
    }
  });

  return myCar;
}

function formatDate(date) {
  // Convert to ISO-8601 format, then remove seconds and milliseconds
  // and change the 'T' to a space
  let isoDate = date.toISOString();
  isoDate = isoDate.substring(0, isoDate.lastIndexOf(':'));
  isoDate = isoDate.replace('T', ' ');
  return isoDate;
}

function getCarResults(params, callback) {
  let url = 'http://carrentals-searchapi-dev.us-east-1.elasticbeanstalk.com/search?';

  // Build the querystring
  const paramString = querystring.stringify({pickupLocation: params.pickuplocation,
    pickupDateTime: formatDate(params.pickupdate),
    dropoffLocation: params.pickuplocation,
    dropoffDateTime: formatDate(params.dropoffdate),
    accountId: 1,
    channelCategory: 'web',
    externalRequestId: 6});

  url += paramString;
  http.get(url, (res) => {
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

