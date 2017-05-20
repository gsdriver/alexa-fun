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
         //"attributes": {},
         "attributes": {"carList":[{"supplier":"THRIFTY","currency":"USD","price":"116.22","model":"Card","class":"Special","imageURL":"https://www.autoescape.com//images-new/cars/direct/384786/60929/XXAR.jpg","detailsURL":"https://book.carrentals.com/goto?brand=CR&language=en&pos=us&account_id=0&pickup_location=SFO&dropoff_location=SFO&pickup_datetime=2017-06-01T10%3A00%3A00Z&dropoff_datetime=2017-06-05T10%3A00%3A00Z&campaign_id=0&vehicle_id=803909&product_id=1&product_type=postpaid&pickup_station_id=33875&dropoff_station_id=33875"},{"supplier":"PAYLESS","currency":"USD","price":"119.28","model":"ACCENT","class":"Economy","imageURL":"https://www.autoescape.com/images-new/cars/hyundai/hyundai_accent_brl_287x164.jpg","detailsURL":"https://book.carrentals.com/goto?brand=CR&language=en&pos=us&account_id=0&pickup_location=SFO&dropoff_location=SFO&pickup_datetime=2017-06-01T10%3A00%3A00Z&dropoff_datetime=2017-06-05T10%3A00%3A00Z&campaign_id=0&vehicle_id=804049&product_id=1&product_type=postpaid&pickup_station_id=80592&dropoff_station_id=80592"},{"supplier":"THRIFTY","currency":"USD","price":"119.98","model":"Spark","class":"Economy","imageURL":"https://www.autoescape.com//images-new/cars/direct/384786/60929/EDAR.jpg","detailsURL":"https://book.carrentals.com/goto?brand=CR&language=en&pos=us&account_id=0&pickup_location=SFO&dropoff_location=SFO&pickup_datetime=2017-06-01T10%3A00%3A00Z&dropoff_datetime=2017-06-05T10%3A00%3A00Z&campaign_id=0&vehicle_id=803916&product_id=1&product_type=postpaid&pickup_station_id=33875&dropoff_station_id=33875"},{"supplier":"DOLLAR","currency":"USD","price":"119.99","model":"RIO","class":"Economy","imageURL":"https://www.autoescape.com/images-new/cars/kia/kia_rio_brl_287x164.jpg","detailsURL":"https://book.carrentals.com/goto?brand=CR&language=en&pos=us&account_id=0&pickup_location=SFO&dropoff_location=SFO&pickup_datetime=2017-06-01T10%3A00%3A00Z&dropoff_datetime=2017-06-05T10%3A00%3A00Z&campaign_id=0&vehicle_id=803892&product_id=1&product_type=postpaid&pickup_station_id=18491&dropoff_station_id=18491"},{"supplier":"PAYLESS","currency":"USD","price":"120.00","model":"VERSA","class":"Compact","imageURL":"https://www.autoescape.com/images-new/cars/nissan/nissan_versa_brl_287x164.jpg","detailsURL":"https://book.carrentals.com/goto?brand=CR&language=en&pos=us&account_id=0&pickup_location=SFO&dropoff_location=SFO&pickup_datetime=2017-06-01T10%3A00%3A00Z&dropoff_datetime=2017-06-05T10%3A00%3A00Z&campaign_id=0&vehicle_id=804050&product_id=1&product_type=postpaid&pickup_station_id=80592&dropoff_station_id=80592"}]},
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
