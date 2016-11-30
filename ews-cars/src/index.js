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

var AlexaSkill = require('./AlexaSkill');
var EWSCar = require('./EWSCar');
var SO = require('./SpeechOutput');

var APP_ID = "amzn1.ask.skill.388f5d43-8dad-4b45-99e4-6b4618553866";
var cachePrefix = "EWSCars:";

var CarSearch = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
CarSearch.prototype = Object.create(AlexaSkill.prototype);
CarSearch.prototype.constructor = CarSearch;

CarSearch.prototype.eventHandlers.onLaunch = function (launchRequest, session, response)
{
    var speechText = "Welcome to Expedia Car Search. You can search for a car by providing a location, dates, and times ... Now, what can I help you with?";
    
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "You can search for a car by saying an airport location, and can also provide dates or times.";

    response.ask(speechText, repromptText);
};

CarSearch.prototype.intentHandlers = {
    // Basic Strategy Intent
    "CarSearchIntent": function (intent, session, response) {
        // Build the car search
        var params = {};
        var error = BuildCarSearchParams(intent, params);

        if (error) {
            SendAlexaResponse(error, null, null, null, null, response);
        }
        else {
            // Let's get the car search results from EWS
            EWSCar.DoCarSearch(params, function(speechError, carList) {
                if (speechError) {
                    SendAlexaResponse(speechError, null, null, null, null, response);
                }
                else {
                    var speechResponse = SO.GetCarResultText(params, carList);

                    session.attributes.carList = carList;
                    SendAlexaResponse(null, null, speechResponse, "Say the number of the car you would like more details about.", null, response);
                }
            });
        }
    },
   // Details on a specific restaurant
   "DetailsIntent" : function (intent, session, response) {
       var idSlot = intent.slots.CarID;

       if (!idSlot || !idSlot.value)
       {
           SendAlexaResponse("I'm sorry, I didn't hear a number of the car you wanted details about.", null, null, null, null, response);
           return;
       }

       // They need to have a list to read details from
       if (!session.attributes || !session.attributes.carList)
       {
            // I need a prior search to work properly
            SendAlexaResponse("You need to get results before asking for car details", null, null, null, null, response);
       }
        else
        {
            SO.ReadCarDetails(session.attributes.carList, idSlot.value, function(error, result, cardText) {
                SendAlexaResponse(error, result, null, null, cardText, response);
            });
        }
   },
    // Stop intent
    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    // Cancel intent - for now we are session-less so does the same as goodbye
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    // Help intent - provide help
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "You can play a game by saying Deal, or you can hear the table rules by saying Read Rules, or you can change the rules by saying Change or, you can say exit... Now, what can I help you with?";
        var repromptText = "You can play a game by saying Deal, or you can say exit... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};

/*
 * Sends a response to Alexa - you would expect one of speechError,
 * speechResponse, or speechQuestion to be set.  repromptQuestion
 * will be set if speechQuestion is set and will be a shorter form
 * of the speechQuestion (just asking what they want to do rather than
 * giving a full game status)
 */
function SendAlexaResponse(speechError, speechResponse, speechQuestion, repromptQuestion, cardContent, response)
{
    var speechOutput;
    var repromptOutput;
    var cardTitle = "Rental Car Search";

    if (speechError)
    {
        speechOutput = {
            speech: speechError,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        repromptOutput = {
            speech: "What else can I help with?",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
    else if (speechResponse) {
        speechOutput = {
            speech: speechResponse,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tellWithCard(speechOutput, cardTitle, ((cardContent) ? cardContent : speechResponse));
    }
    else {
        speechOutput = {
            speech: speechQuestion,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        repromptOutput = {
            speech: repromptQuestion,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.askWithCard(speechOutput, repromptOutput, cardTitle, ((cardContent) ? cardContent : speechQuestion));
    }
}

function GetIntentDate(dateSlot, timeSlot, baseDate, offsetDays)
{
    var dat = null;

    // Is there a date in the slot?
    if (dateSlot && dateSlot.value)
    {
        // Use this one - round time up to the nearest 30 minutes
        var base = new Date(dateSlot.value);
        dat = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));

        // Do I have a time?
        if (timeSlot && timeSlot.value)
        {
            // Can be one of these special values - night: NI, morning: MO, afternoon: AF, evening: EV
            var timeMapping = {"ni": 21, "mo": 9, "af": 14, "ev": 17};

            if (timeMapping[timeSlot.value.toLowerCase()])
            {
                dat.setUTCHours(timeMapping[timeSlot.value.toLowerCase()], 0);
            }
            else
            {
                // Split it by the colon
                var times = timeSlot.value.split(":");

                if ((times.length >= 2) && !isNaN(parseInt(times[0])) && !isNaN(parseInt(times[1])))
                {
                    dat.setUTCHours(parseInt(times[0]), parseInt(times[1]));
                }
                else
                {
                    // Just go with 10:00 AM
                    dat.setUTCHours(10, 0);
                }
            }
        }
        else
        {
            // Go with 10:00 AM
            dat.setUTCHours(10, 0);
        }

        // If this date is in the past, null it out so we go with the default
        if (dat < baseDate)
        {
            dat = null;
        }
        else if ((dat.getUTCMinutes() != 0) && (dat.getUTCMinutes() != 30))
        {
            // Snap to 30 minutes
            if (dat.getUTCMinutes() < 30)
            {
                dat.setUTCMinutes(30);
            }
            else
            {
                dat.setUTCHours(dat.getUTCHours() + 1, 0);
            }
        }
    }

    if (!dat)
    {
        // No date, use the baseDate and offset to set the date
        var base = new Date(baseDate);
        dat = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
        dat.setDate(dat.getDate() + offsetDays);

        // Time is set to 10:00 AM
        dat.setUTCHours(10, 0);
    }

    return dat;
}

function BuildCarSearchParams(intent, searchParams)
{
    var airportCode = "";
    var dat;

    // I only support three character airport codes
    airportCode += (!intent.slots.FirstTLALetter || !intent.slots.FirstTLALetter.value) ? "" : intent.slots.FirstTLALetter.value;
    airportCode += (!intent.slots.SecondTLALetter || !intent.slots.SecondTLALetter.value) ? "" : intent.slots.SecondTLALetter.value;
    airportCode += (!intent.slots.ThirdTLALetter || !intent.slots.ThirdTLALetter.value) ? "" : intent.slots.ThirdTLALetter.value;

    if (airportCode.length != 3)
    {
        return (airportCode + " is not a valid three-letter airport code");
    }
    searchParams.pickuplocation = airportCode;

    // Set the dates - by default (if dates are not set), this will be 7 days from now for 2 days
    searchParams.pickupdate = GetIntentDate(intent.slots.PickUpDate, intent.slots.PickUpTime, Date.now(), 7);
    searchParams.dropoffdate = GetIntentDate(intent.slots.DropOffDate, intent.slots.DropOffTime, searchParams.pickupdate, 2);

    // There was no error
    return null;
}

exports.handler = function (event, context) 
{
    var car = new CarSearch();
    car.execute(event, context);
};
