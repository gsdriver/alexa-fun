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

var http = require('http');
var config = require('./config');
var request = require('request');
var convert = require('xml-js');

module.exports = {
    // Does a Car Search
    DoCarSearch: function (params, callback)
    {
        GetCarResults(params, function(error, CRResults)
        {
            // Now that we have results, we need to turn the results into a string
            if (error)
            {
                callback(error, null);
            }
            else
            {
                // Pull out
                var carResults = [];
                var classMapping = {M: 'Mini', N: 'Mini Elite', E: 'Economy', H: 'Economy Elite',
                                    C: 'Compact', D:'Compact Elite', I:'Intermediate', J:'Intermediate Elite',
                                    S: 'Standard', R:'Standard Elite', F:'Fullsize', G:'Fullsize Elite',
                                    P: 'Premium', U:'Premium Elite', L:'Luxury', W:'Luxury Elite',
                                    O: 'Oversize', X:'Special'};

                // Return only the fields we care about
                CRResults.Response.Suppliers.Supplier.forEach(car => {
                    car.Vehicles.Vehicle.forEach(vehicle => {
                        var newCar = {};

                        // Car-level data
                        newCar.supplier = car._attributes.Name;
                        newCar.currency = car._attributes.Currency;

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
                carResults.sort((a,b) => (a.price - b.price));
                callback(null, carResults.slice(0,5));
            }
        });
    }
};

/*
 * Internal functions
 */
function FormatDate(date)
{
    var retval = "";

    // Convert to ISO-8601 format, then remove milliseconds
    retval = date.toISOString();
    retval = retval.substring(0, retval.lastIndexOf(":"));
    retval += ":00Z";
    return retval;
}

function GetCarResults(params, callback)
{
    var searchXML = '<?xml version="1.0" encoding="UTF-8"?>';

    // Build the XML request
    searchXML += '<Request xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="../request/SearchRQ.xsd">';
    searchXML += '<Head><SessionId>'
    searchXML += config.CRSessionID;
    searchXML += '</SessionId><WSName>Search</WSName><Brand>CR</Brand><POS>us</POS>';
    searchXML += '<Language>en</Language><AccountId>0</AccountId><Channel>web</Channel></Head>';
    searchXML += '<VehAvail LocationType="IATA" PickUpDateTime="';
    searchXML += FormatDate(params.pickupdate);
    searchXML += '" DropOffDateTime="';
    searchXML += FormatDate(params.dropoffdate);
    searchXML += '"><PickUpLocation Code="';
    searchXML += params.pickuplocation;
    searchXML += '"/><DropOffLocation Code="';
    searchXML += params.pickuplocation;
    searchXML += '"/></VehAvail> </Request>';

    request.post(
        {url:config.TarsierEndpoint,
        body:searchXML,
        headers: {'Content-Type': 'application/xml'}
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var result = convert.xml2json(body, {compact: true, spaces: 4});

                callback(null, JSON.parse(result));
            }
            else
            {
                calback(error, null);
            }
        }
    );
}
