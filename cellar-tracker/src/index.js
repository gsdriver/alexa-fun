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
var WineSelector = require('./WineSelector');
var CellarTracker = require('./CellarTracker');

var APP_ID = "amzn1.ask.skill.0a75de20-0209-4b51-ba16-4958a157cdd4";

var WineApp = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
WineApp.prototype = Object.create(AlexaSkill.prototype);
WineApp.prototype.constructor = WineApp;

WineApp.prototype.eventHandlers.onLaunch = function (launchRequest, session, response)
{
    var speechText = "Welcome to the wine application. You can say pick a wine or read my list ... Now, what can I help you with.";
    
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

WineApp.prototype.intentHandlers = {
    // Basic Strategy Intent
    "PickWineIntent": function (intent, session, response) {
        // First make sure we have an action
        var error;
        var wineCharacteristics = {};
        var numDescriptions = 0;

        // Build the characteristics object - you can have up to two descriptions
        numDescriptions += (AddWineDescriptor(wineCharacteristics, intent.slots.FirstDescriptor) ? 1 : 0);
        numDescriptions += (AddWineDescriptor(wineCharacteristics, intent.slots.SecondDescriptor) ? 1 : 0);

        // If there were no descriptions, we'll just pick a random wine
        if (!numDescriptions)
        {
            wineCharacteristics.random = true;
        }

        // OK, get the list of wines
        CellarTracker.ReadWineList(function(error, wineList) {
            if (error)
            {
                SendAlexaResponse(error, null, response);
            }
            else
            {
                // We have a wine list, so make a selection from it
                SendAlexaResponse(null, WineSelector.PickWine(wineList, wineCharacteristics), response);
            }
        });
    },
    // Suggestion intent
    "ReadWineListIntent" : function (intent, session, response) {
        // For now, just read the number of wines by type
        CellarTracker.ReadWineList(function(error, wineList) {
            if (error)
            {
                SendAlexaResponse(error, null, response);
            }
            else
            {
                var speech = "You have ";
                var categories = {};

                wineList.wines.forEach(wine => {
                    if (categories[wine["MasterVarietal"]])
                        categories[wine["MasterVarietal"]] += wine["Quantity"];
                    else
                        categories[wine["MasterVarietal"]] = wine["Quantity"];
                });

                for (var categoryName in categories)
                {
                    speech += categories[categoryName] + " " + categoryName + " ";
                }

                SendAlexaResponse(null, speech, response);
            }
        });
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
        var speechText = "You can ask for a wine by saying pick a red wine or pick a good white wine, or you can say exit... Now, what can I help you with?";
        var repromptText = "You can ask for a wine by saying pick a red wine or pick a good white wine, or you can say exit... Now, what can I help you with?";
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

function SendAlexaResponse(speechError, speech, response)
{
    var speechOutput;
    var repromptOutput;
    var cardTitle = "Wine Application";

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
    else {
        speechOutput = {
            speech: speech,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tellWithCard(speechOutput, cardTitle, speech);
    }

    console.log(speechOutput.speech);
}

/*
 * Maps whatever the user said to the appropriate descriptor
 */
function AddWineDescriptor(wineCharacteristics, descriptorSlot)
{
    // Let's see what the descriptor is, and add the appropriate field to the wineCharacteristics object
    var descriptorMapping = {"old": {field: "vintage", value: "old"},
            "new": {field: "vintage", value: "new"},
            "young": {field: "vintage", value: "new"},
            "red": {field: "type", value: "red"},
            "white": {field: "type", value: "white"},
            "random": {field: "random", value: true},
            "good": {field: "minScore", value: 90},
            "great": {field: "minScore", value: 94},
            "cabernet": {field: "varietal", value: "cabernet"},
            "syrah": {field: "varietal", value: "syrah"},
            "chardonnay": {field: "varietal", value: "chardonnay"},
            "merlot": {field: "varietal", value: "merlot"},
            "zinfandel": {field: "varietal", value: "zinfandel"},
            "pinot noir": {field: "varietal", value: "pinot noir"},
            "malbec": {field: "varietal", value: "malbec"},
            "red blend": {field: "varietal", value: "red blend"},
            "blend": {field: "varietal", value: "red blend"},
            "white blend": {field: "varietal", value: "white blend"},
            "bold": {field: "special", value: "big red"},
            "big": {field: "special", value: "big red"},
            "light": {field: "special", value: "light white"},
            "overdue": {field: "consumeDate", value: "over"},
            "expired": {field: "consumeDate", value: "over"},
            "near due": {field: "consumeDate", value: "near"},
            "near": {field: "consumeDate", value: "near"},
            "ready to drink": {field: "consumeDate", value: "now"}
        };
    var descriptor = null;

    if (descriptorSlot && descriptorSlot.value)
    {
        // OK, let's see if it's in the list
        descriptor = descriptorMapping[descriptorSlot.value.toLowerCase()];
        if (descriptor)
        {
            wineCharacteristics[descriptor.field] = descriptor.value;
        }
    }

    return descriptor;
}

exports.handler = function (event, context) 
{
    var wine = new WineApp();
    wine.execute(event, context);
};
