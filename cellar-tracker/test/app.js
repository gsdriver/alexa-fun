var wineO = require('../src/index');

function BuildEvent(argv)
{
    // Templates that can fill in the intent
    var pickWineIntent = {"name": "PickWineIntent", "slots": {"Description1": {"name": "Description1", "value": ""}, "Description2": {"name": "Description2", "value": ""}}};
    var readListIntent = {"name": "ReadWineListIntent", "slots": {}};

    var lambda = {
       "session": {
         "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
         "application": {
           "applicationId": "amzn1.ask.skill.74ea63e3-3295-463f-8ea5-cd80f4b6cfc9"
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

    // If there is no argument, then we'll just ask for the rules
    if ((argv.length <= 2) || (argv[2] == "read"))
    {
        lambda.request.intent = readListIntent;
    }
    else if (argv[2] == "pick")
    {
        pickWineIntent.slots.Description1.value = (argv.length > 3) ? argv[3] : "";
        pickWineIntent.slots.Description2.value = (argv.length > 4) ? argv[4] : "";
        lambda.request.intent = pickWineIntent;
    }

    return lambda;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
    this._appId = appId;
}

myResponse.succeed = function(result) {
    console.log(result.response.outputSpeech.text);
}

// Build the event object and call the app
wineO.handler(BuildEvent(process.argv), myResponse);

/*
// Read the list of wines
function SortByScore(error, wineList)
{
    if (error)
    {
        console.log("Error - " + error);
    }
    else
    {
        // Just for fun, print out wines sorted by score
        wineList.wines.sort(function(a,b){return b.CT-a.CT;});
        wineList.wines.forEach(wine => {if (wine.CT) { console.log(wine.Wine + " with score " + wine.CT); } });
    }
}

function CountWinesByField(field, error, wineList)
{
    var categories = {};

    if (error)
    {
        console.log("Error - " + error);
    }
    else
    {
        wineList.wines.forEach(wine => {if (categories[wine[field]]) categories[wine[field]]++; else categories[wine[field]] = 1;});

        // List each type
        for (var categoryName in categories)
        {
            console.log("Number of " + categoryName + " is " + categories[categoryName]);
        }
    }
}

function ReadWineList(error, wineList)
{
    CountWinesByField("Type", error, wineList);
    console.log("*****");
    CountWinesByField("MasterVarietal", error, wineList);
}

wineO.ReadWineList(ReadWineList);
*/