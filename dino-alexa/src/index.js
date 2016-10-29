
/**
 * App ID for the skill
 */
var APP_ID = undefined;

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var DinoSkill = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
DinoSkill.prototype = Object.create(AlexaSkill.prototype);
DinoSkill.prototype.constructor = DinoSkill;

DinoSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("DinoSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

DinoSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("DinoSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Suger Skills Kit, you can say hi";
    var repromptText = "You can say hi";
    response.ask(speechOutput, repromptText);
};

DinoSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("DinoSkill onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

DinoSkill.prototype.intentHandlers = {
    // register custom intent handlers
    "DinoIntent": function (intent, session, response) {
        var speech = GetDinoResponse();
        response.tellWithCard(speech, "Dino Says", speech);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can ask me a question!", "You can ask me a question!");
    }
};

function GetDinoResponse() {
    var responseTable = [ 
        "DINOTRUX! GET IT DONE! GOING STRONG! DIONOTUX! ROAR!",
        "CRUSH IT! SMASH IT! MOVE IT! LIFT IT!",
        "Ty Rux",
        "Ton-Ton",
        "Dozer"
    ];

    // Pick a random entry in the responseTable array
    var index = Math.floor(Math.random() * responseTable.length);

    return responseTable[index];
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the SugerSkill skill.
    var dino = new DinoSkill();
    dino.execute(event, context);
};

