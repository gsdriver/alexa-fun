/*
 * MIT License

 * Copyright (c) 2016 Garrett Vargas

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

var http = require('http');
var config = require('./config');

module.exports = {
    // Does a Car Search
    DoCarSearch: function (params, callback)
    {
        GetCarResults(params, function(error, carResults)
        {
            // Now that we have results, we need to turn the results into a string
            if (error)
            {
                callback(error, null);
            }
            else
            {
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
