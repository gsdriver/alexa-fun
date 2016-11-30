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

module.exports = {
    // Convert a response of car results to text output
    GetCarResultText : function (params, carResults)
    {
        var result = "";
        var i;

        result = "I found " + carResults.length + " results ";
        result += "at " + params.pickuplocation;
        result += " from " + DateToText(params.pickupdate);
        result += " to " + DateToText(params.dropoffdate) + ". ";
        result += "You can say the number of the car you would like to hear more about.";

        for (i = 0; i < carResults.length; i++)
        {
            result += (" " + (i + 1) + " ... " + CarToText(carResults[i]));
        }

        return result;
    }
};

/*
 * Internal functions
 */

function DateToText(date)
{
    var DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var result = "";
    var base = new Date();
    var now = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
    var isPM;

    result = DOW[date.getUTCDay()];
    result += " " + months[date.getUTCMonth()];
    result += " " + date.getUTCDate();

    if (date.getUTCFullYear() != now.getUTCFullYear())
    {
        result += " " + date.getUTCFullYear();
    }

    result += " at ";

    if (date.getUTCHours() > 12)
    {
        result += (date.getUTCHours() - 12);
        isPM = true;
    }
    else
    {
        result += date.getUTCHours();
        isPM = false;
    }

    result += " " + ((date.getUTCMinutes() == 0) ? "o clock" : date.getUTCMinutes());
    result += " " + ((isPM) ? "PM" : "AM");

    return result;
}

function CarToText(carInfo)
{
    var result = "";

    // We return CarMakeModel, CarClass, SupplierName, and total price
    result += "For " + carInfo.price + " dollars";
    result += " a " + carInfo.model;
    result += " from " + carInfo.supplier;
    result += " which is a " + carInfo.class + " option.";

    return result;
}
