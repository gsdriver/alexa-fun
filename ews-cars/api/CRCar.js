/*
 * Calls CarRentals Tarsier API to perform a search
 *
 * Returns results in a JSON array with the following fields:
 *
 *      price, currency, model, class, supplier, imageURL, detailsURL
 *
 * The idea is that this file can be replaced with one that calls a different API
 * so long as it maps its results to a JSON array that matches the same format
 */

'use strict';

const config = require('../config');
const request = require('request');
const convert = require('xml-js');

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
        CRResults.Response.Suppliers.Supplier.forEach((supplier) => {
          supplier.Vehicles.Vehicle.forEach((vehicle) => {
            const newCar = {};

            // Supplier-level data
            newCar.supplier = supplier._attributes.Name;
            newCar.currency = supplier._attributes.Currency;

            // Vehicle-level data
            newCar.price = vehicle.Products.Product.Price._attributes.Amount;
            newCar.model = vehicle.Model._text;
            newCar.class = classMapping[vehicle.Acriss._text[0]];
            newCar.imageURL = vehicle.Image._text;
            newCar.detailsURL = vehicle.Products.Product.DeeplinkURL._cdata;

            carResults.push(newCar);
          });
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
function formatDate(date) {
  // Convert to ISO-8601 format, then remove milliseconds
  const isoDate = date.toISOString();
  return isoDate.substring(0, isoDate.lastIndexOf(':')) + ':00Z';
}

function getCarResults(params, callback) {
  let searchXML = '<?xml version="1.0" encoding="UTF-8"?>';

  // Build the XML request
  searchXML += '<Request xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="../request/SearchRQ.xsd"><Head><SessionId>';
  searchXML += config.CRSessionID;
  searchXML += '</SessionId><WSName>Search</WSName><Brand>CR</Brand><POS>us</POS>';
  searchXML += '<Language>en</Language><AccountId>0</AccountId><Channel>web</Channel></Head><VehAvail LocationType="IATA" PickUpDateTime="';
  searchXML += formatDate(params.pickupdate);
  searchXML += '" DropOffDateTime="';
  searchXML += formatDate(params.dropoffdate);
  searchXML += '"><PickUpLocation Code="';
  searchXML += params.pickuplocation;
  searchXML += '"/><DropOffLocation Code="';
  searchXML += params.pickuplocation;
  searchXML += '"/></VehAvail> </Request>';

  request.post({url: config.TarsierEndpoint, body: searchXML, headers: {'Content-Type': 'application/xml'}},
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const result = convert.xml2json(body, {compact: true, spaces: 4});
        callback(null, JSON.parse(result));
      } else {
        calback((error) ? error : response.statusCode, null);
      }
    }
  );
}
