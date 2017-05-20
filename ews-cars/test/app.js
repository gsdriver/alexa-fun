var mainApp = require('../index');

function BuildEvent(argv)
{
    // Templates that can fill in the intent
    var carSearchIntent = {"name": "CarSearchIntent",
        "slots": {"Location": {"name": "Location", "value": ""},
                "PickUpDate": {"name": "PickUpDate"},
                "PickUpTime": {"name": "PickUpTime"},
                "DropOffDate": {"name": "DropOffDate"},
                "DropOffTime": {"name": "DropOffTime"}
    }};
    var detailsIntent = {"name": "DetailsIntent",
        "slots" : {"CarID": {"name": "CarID", "value": ""}}};

    var lambda = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.388f5d43-8dad-4b45-99e4-6b4618553866"
         },
         "attributes": {},
         "user": {
           "userId": "amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI"
         },
         "new": true
       },
       "request": {
         "type": "IntentRequest",
         "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
         "locale": "en-US",
         "timestamp": "2016-11-03T21:31:08Z",
         "intent": {}
       },
       "version": "1.0"
     };

    var openEvent = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.388f5d43-8dad-4b45-99e4-6b4618553866"
         },
         "attributes": {},
         "user": {
           "userId": "amzn1.ask.account.AFLJ3RYNI3X6MQMX4KVH52CZKDSI6PMWCQWRBHSPJJPR2MKGDNJHW36XF2ET6I2BFUDRKH3SR2ACZ5VCRLXLGJFBTQGY4RNYZA763JED57USTK6F7IRYT6KR3XYO2ZTKK55OM6ID2WQXQKKXJCYMWXQ74YXREHVTQ3VUD5QHYBJTKHDDH5R4ALQAGIQKPFL52A3HQ377WNCCHYI"
         },
         "new": true
       },
       "request": {
         "type": "LaunchRequest",
         "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
         "locale": "en-US",
         "timestamp": "2016-11-03T21:31:08Z",
         "intent": {}
       },
       "version": "1.0"
    };

    // If there is no argument, then we'll just open
    if ((argv.length <= 2) || (argv[2] == "open"))
    {
        return openEvent;
    }
    else if (argv[2] == "search")
    {
        lambda.request.intent = carSearchIntent;
        carSearchIntent.slots.Location.value = (argv.length > 3) ? argv[3] : "";
        if (argv.length > 4)
        {
            // Pickup date
            carSearchIntent.slots.PickUpDate.value = argv[4];
        }
        if (argv.length > 5)
        {
            // Pickup time (if not none)
            if (argv[5] != "none")
            {
                carSearchIntent.slots.PickUpTime.value = argv[5];
            }
        }
        if (argv.length > 6)
        {
            // Pickup date
            carSearchIntent.slots.DropOffDate.value = argv[6];
        }
        if (argv.length > 7)
        {
            // Pickup time (if not none)
            if (argv[7] != "none")
            {
                carSearchIntent.slots.DropOffTime.value = argv[7];
            }
        }
    }
    else if (argv[2] == "details")
    {
        lambda.request.intent = detailsIntent;
        detailsIntent.slots.CarID.value = (argv.length > 3) ? argv[3] : 1;
    }
    else
    {
        // Sorry, no can do this one
        console.log("Invalid option sent to test");
        return null;
    }

    return lambda;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

myResponse.succeed = function(result) {
  if (result.response.outputSpeech.ssml) {
    console.log('AS SSML: ' + result.response.outputSpeech.ssml);
  } else {
    console.log(result.response.outputSpeech.text);
  }
  if (result.response.card && result.response.card.content) {
    console.log('Card Content: ' + result.response.card.content);
  }
  console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
  if (result.sessionAttributes) {
    console.log('Attributes: ' + JSON.stringify(result.sessionAttributes));
  }
}

myResponse.fail = function(e) {
  console.log(e);
}

// Build the event object and call the app
var event = BuildEvent(process.argv);
if (event) {
    mainApp.handler(event, myResponse);
}
