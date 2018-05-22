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

var https = require('https');
var config = require('./config');

// Split the fields we care about based on whether they should be read as an integer, string, or float
const myIntFields = ["Quantity","Vintage","BeginConsume","EndConsume"];
const myStringFields = ["Location","Size","Wine","Producer","Type","Varietal","MasterVarietal"];
const myFloatFields = ["CT"];

module.exports = {
    // Reads in the user's wine list and stores relevant details into a JSON list
    ReadWineList : function (callback)
    {
        // Format the URL
        var wineURL = "https://www.cellartracker.com/xlquery.asp?table=List&Location=1&User="
                + encodeURIComponent(config.userName) + "&Password=" + encodeURIComponent(config.password) + "&Format=tab";
        var wineList;

        https.get(wineURL, function (res) {
            if (res.statusCode == 200)
            {
                // Great, we should have a full wine list!
                var fulltext = '';

                res.on('data', function(data) {
                    fulltext += data;
                });

                res.on('end', function() {
                    // Should catch errors here too...
                    wineList = ParseWineList(fulltext);
                    callback(null, wineList);
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
};

/*
 * Internal functions
 */
function ParseWineList(wineText)
{
    // fullText consists of a series of lines of comma-separated values
    var lines = wineText.split("\n");
    var wineList = {wines: []};

    if (lines && lines.length)
    {
        var header = ProcessHeader(lines.shift());
        if (header)
        {
            lines.forEach(line => {let wine = ParseOneWine(header, line); if (wine) wineList.wines.push(wine);});
        }
    }

    return wineList;
}

function ProcessHeader(line)
{
    var header = {};
    var fields = line.split("\t");
    var i;

    // Store the position of each header field for later lookup
    for (i = 0 ; i < fields.length; i++)
    {
        header[fields[i]] = i;
    }

    // Make sure the fields I care about are there
    for (i = 0; i < myIntFields.length; i++)
    {
        if (!header.hasOwnProperty(myIntFields[i]))
        {
            console.log("Didn't see " + myIntFields[i]);
            return null;
        }
    }
    for (i = 0; i < myStringFields.length; i++)
    {
        if (!header.hasOwnProperty(myStringFields[i]))
        {
            console.log("Didn't see " + myStringFields[i]);
            return null;
        }
    }
    for (i = 0; i < myFloatFields.length; i++)
    {
        if (!header.hasOwnProperty(myFloatFields[i]))
        {
            console.log("Didn't see " + myFloatFields[i]);
            return null;
        }
    }

    return header;
}

/*
 * Parses a single line from the server
 * This is the full list of fields returned
 *
 *  "iWine","WineBarcode","Quantity","Pending","Location","Bin","Size","Price","Valuation","MyValue","WBValue","CTValue",
 *  "MenuPrice","Vintage","Wine","Locale","Country","Region","SubRegion","Appellation","Producer","SortProducer","Type",
 *  "Varietal","MasterVarietal","Designation","Vineyard","WA","WS","IWC","BH","AG","WE","JR","RH","JG","GV","JK","LD",
 *  "CW","WFW","PR","SJ","WD","RR","JH","MFW","WWR","IWR","CHG","TT","CT","MY","BeginConsume","EndConsume","UPC"
 *
 * We only care about
 *  "Quantity","Location","Size","Vintage","Wine","Producer","Type","Varietal","MasterVarietal","CT","BeginConsume","EndConsume"
 */
function ParseOneWine(header, line)
{
    // OK, let's parse this wine
    var fields = line.split("\t");
    var wine = {};

    // If there isn't at least two fields, we bail
    if (fields.length < 2)
    {
        return null;
    }

    // Now read each field and process as integer, string, or float
    // We want to remove the quotes that came from the server response
    myIntFields.forEach(field => {wine[field] = parseInt(fields[header[field]]);});
    myStringFields.forEach(field => {wine[field] = fields[header[field]];});
    myFloatFields.forEach(field => {wine[field] = parseFloat(fields[header[field]]);});
    return wine;
}