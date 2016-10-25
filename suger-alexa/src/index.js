
/**
 * App ID for the skill
 */
var APP_ID = undefined;

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var SugerSkill = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
SugerSkill.prototype = Object.create(AlexaSkill.prototype);
SugerSkill.prototype.constructor = SugerSkill;

SugerSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("SugerSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

SugerSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("SugerSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Suger Skills Kit, you can say hi";
    var repromptText = "You can say hi";
    response.ask(speechOutput, repromptText);
};

SugerSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("SugerSkill onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

SugerSkill.prototype.intentHandlers = {
    // register custom intent handlers
    "SugerIntent": function (intent, session, response) {
        var speech = GetSugerResponse();
        response.tellWithCard(speech, "Suger Says", speech);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can ask me a question!", "You can ask me a question!");
    }
};

function GetSugerResponse() {
    var responseTable = [
        "I like steak",
        "When's dinner?",
        "Can we go for a walk?",
        "Where's mom?"
    ];

    // Pick a random entry in the responseTable array
    var index = Math.floor(Math.random() * responseTable.length);

    return responseTable[index];
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the SugerSkill skill.
    var suger = new SugerSkill();
    suger.execute(event, context);
};

