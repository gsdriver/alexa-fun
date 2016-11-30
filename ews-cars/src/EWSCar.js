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

module.exports = {
    // Does a Car Search
    DoCarSearch: function (params, callback)
    {
        GetCarResults(params, function(error, ewsResults)
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

                // Return only the fields we care about
                ewsResults.CarInfoList.CarInfo.forEach(car => {
                    var newCar = {};

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
    }
};

/*
 * Internal functions
 */
function FormatDate(date)
{
    var retval = "";

    // Convert to ISO-8601 format, then remove seconds
    retval = date.toISOString();
    retval = retval.substring(0, retval.lastIndexOf(":"));
    return retval;
}

function GetCarResults(params, callback)
{
    // Build the request
    var queryString = "?key=" + config.EWSkey;

    // Add in parameters
    queryString += "&pickuplocation=" + params.pickuplocation;
    queryString += "&pickupdate=" + FormatDate(params.pickupdate);
    queryString += "&dropoffdate=" + FormatDate(params.dropoffdate);
    queryString += "&sort=price&limit=5&format=json";
console.log(config.serviceEndpoint + queryString);

    http.get(config.serviceEndpoint + queryString, function (res) {
        if (res.statusCode == 200)
        {
            // Great, we should have a game!
            var fulltext = '';

            res.on('data', function(data) {
                fulltext += data;
            });

            res.on('end', function() {
                callback(null, JSON.parse(fulltext));
            });
        }
        else
        {
            // Sorry, there was an error calling the HTTP endpoint
            callback("Unable to call endpoint", null);
        }
    }).on('error', function (e) {
        callback("Communications error: " + e.message, null);
    });
}
