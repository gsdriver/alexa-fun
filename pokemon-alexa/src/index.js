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
var PokemonList = require('./Pokemon');

var APP_ID = undefined; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * PokemonHelp is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var PokemonHelp = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
PokemonHelp.prototype = Object.create(AlexaSkill.prototype);
PokemonHelp.prototype.constructor = PokemonHelp;

PokemonHelp.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) 
{
    var speechText = "Welcome to the Pokemon helper. You can ask a question like, what type is Pikachu? ... Now, what can I help you with.";
    
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

PokemonHelp.prototype.intentHandlers = {
    "PokemonTypeIntent": function (intent, session, response) {
        var pokemonSlot = intent.slots.Pokemon;
        var speechOutput;
        var repromptOutput;

        var cardTitle = "Pokemon Type";

        // OK, let's see what Pokemon this is
        if (pokemonSlot && pokemonSlot.value) {
            // Great, we have a Pokemon we can look up in our table
            var entry = PokemonList[pokemonSlot.value];

            if (entry) {
                // Return the entry
                var pokeType = pokemonSlot.value + " is a " + entry.types[0];

                if (entry.types.length > 1) {
                    pokeType += (" and " + entry.types[1]);
                }

                pokeType += " type of Pokemon";

                // Special case. :)
                if (pokemonSlot.value == "Growlithe") {
                    pokeType += ". You can also call her Suger.";
                }
                speechOutput = {
                    speech: pokeType,
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                response.tellWithCard(speechOutput, cardTitle, pokemonSlot.value);
            }
            else {
                // Hmm, couldn't find that one
                speechOutput = {
                    speech: "I don't recognize the Pokemon " + pokemonSlot.value,
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                repromptOutput = {
                    speech: "What else can I help with?",
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                response.ask(speechOutput, repromptOutput);
            }
        }
        else {
            // I don't recognize this Pokemon
            speechOutput = {
                speech: "Please provide the name of a Pokemon",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptOutput = {
                speech: "What else can I help with?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.ask(speechOutput, repromptOutput);
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
        var speechText = "You can ask questions such as, what type is Pikachu, or, you can say exit... Now, what can I help you with?";
        var repromptText = "You can say things like, what type is Pikachu, or you can say exit... Now, what can I help you with?";
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

exports.handler = function (event, context) 
{
    var pokemon = new PokemonHelp();
    pokemon.execute(event, context);
};
