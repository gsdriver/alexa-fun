//
// Performs a car search
//

'use strict';

const EWSCar = require('../api/CRCar'); //require('./api/EWSCar');
const SO = require('../SpeechOutput');

module.exports = {
  handleIntent: function() {
    // Build the car search
    const params = {};
    const error = buildCarSearchParams(this.event.request.intent, params);

    if (error) {
      this.emit(':ask', error, 'What else can I help with?');
    } else {
      // Let's get the car search results from EWS
      EWSCar.doCarSearch(params, (speechError, carList) => {
        if (speechError) {
          this.emit(':ask', speechError, 'What else can I help with?');
        } else {
          var speechResponse = SO.getCarResultText(params, carList);

          this.attributes['carList'] = carList;
          this.emit(':ask', speechResponse, 'Say the number of the car you would like more details about.');
        }
      });
    }
  },
};

function getAlexaDate(dateValue) {
  var date;
  var now = new Date(Date.now());

  // This will be an ISO-8601 date, though it may have special values that we'll have to account for
  // We check for these special cases as outlined at
  // https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interaction-model-reference

  // A season as follows:  winter: WI, spring: SP, summer: SU, fall: FA
  var seasonMapping = {'WI': 1, 'SP': 4, 'SU': 7, 'FA': 10};
  if (seasonMapping[dateValue]) {
    // Make it the 15th day of this month
    date = new Date(now.getFullYear(), seasonMapping[dateValue], 15);
    if (date < now) {
      // Bump to next year
      date.setFullYear(date.getFullYear() + 1);
    }

    return date;
  }

  // Just a week will have a week number (2015-W49)
  if (dateValue.indexOf('W') > -1) {
    var segments = dateValue.split('-');
    var weekNumber = parseInt(segments[1].slice(1));

    // Figure out the week number - then we'll just use the fact that Jan 4 is always week 1
    date = new Date(segments[0], 0, 4);
    date.setUTCDate(date.getUTCDate() + 7 * (weekNumber - 1));

    // a weekend for a specific week will end in WE (2015-W49-WE)
    if ((segments.length == 3) && (segments[2] == 'WE')) {
      // Mark this as Saturday (adding to the current date)
      date.setUTCDate(date.getUTCDate() + (6 - date.getUTCDay()));
    }

    return date;
  }

  // it could also be a decade (201X)
  if (dateValue.indexOf('X') > -1) {
    // We don't support this
    return null;
  }

  // the month or day may be missing (e.g. 2015-12 or 2016)
  var segments = dateValue.split('-');
  if (segments.length == 1) {
    // Just a year?
    dateValue += '-01-15';
  } else if (segments.length == 2) {
    // No day?
    dateValue += '-15';
  }

  // OK, maybe it's just a date
  var base = new Date(dateValue);
  date = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
  return base;
}

function getIntentDate(dateSlot, timeSlot, baseDate, offsetDays) {
  var dat = null;

  // Is there a date in the slot?
  if (dateSlot && dateSlot.value) {
    // Use this one - round time up to the nearest 30 minutes
    dat = getAlexaDate(dateSlot.value);
    if (dat) {
      // Do I have a time?
      if (timeSlot && timeSlot.value) {
        // Can be one of these special values - night: NI, morning: MO, afternoon: AF, evening: EV
        var timeMapping = {'ni': 21, 'mo': 9, 'af': 14, 'ev': 17};

        if (timeMapping[timeSlot.value.toLowerCase()]) {
            dat.setUTCHours(timeMapping[timeSlot.value.toLowerCase()], 0);
        } else {
            // Split it by the colon
            var times = timeSlot.value.split(':');

            if ((times.length >= 2) && !isNaN(parseInt(times[0])) && !isNaN(parseInt(times[1]))) {
                dat.setUTCHours(parseInt(times[0]), parseInt(times[1]));
            } else {
                // Just go with 10:00 AM
                dat.setUTCHours(10, 0);
            }
        }
      } else {
        // Go with 10:00 AM
        dat.setUTCHours(10, 0);
      }

      // If this date is in the past, null it out so we go with the default
      if (dat < baseDate) {
        dat = null;
      } else if ((dat.getUTCMinutes() != 0) && (dat.getUTCMinutes() != 30)) {
        // Snap to 30 minutes
        if (dat.getUTCMinutes() < 30) {
          dat.setUTCMinutes(30);
        } else {
          dat.setUTCHours(dat.getUTCHours() + 1, 0);
        }
      }
    }
  }

  if (!dat) {
    // No date, use the baseDate and offset to set the date
    var base = new Date(baseDate);
    dat = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
    dat.setDate(dat.getDate() + offsetDays);

    // Time is set to 10:00 AM
    dat.setUTCHours(10, 0);
  }

  return dat;
}

function buildCarSearchParams(intent, searchParams) {
  let airportCode = '';
  let dat;

  // If we have a city, then get the TLA from it
  if (!intent.slots.Location || !intent.slots.Location.value) {
    return 'You need to specify a city for your car.';
  }

  airportCode = getAirportCode(intent.slots.Location.value);
  if (!airportCode) {
    return (intent.slots.Location.value + ' is not a city I can search for a car.');
  }

  searchParams.pickuplocation = airportCode;
  searchParams.pickupcity = intent.slots.Location.value;

  // Set the dates - by default (if dates are not set), this will be 7 days from now for 2 days
  searchParams.pickupdate = getIntentDate(intent.slots.PickUpDate,
    intent.slots.PickUpTime, Date.now(), 7);
  searchParams.dropoffdate = getIntentDate(intent.slots.DropOffDate,
    intent.slots.DropOffTime, searchParams.pickupdate, 2);

  // There was no error
  return null;
}

function getAirportCode(location) {
  // A mapping of US cities to airport codes,  as taken from https://en.wikipedia.org/wiki/List_of_airports_in_the_United_States
  const cityMapping = {'birmingham': 'BHM', 'dothan': 'DHN', 'huntsville': 'HSV', 'mobile': 'MOB', 'montgomery': 'MGM', 'anchorage': 'ANC',
  'aniak': 'ANI', 'barrow': 'BRW', 'bethel': 'BET', 'cordova': 'CDV', 'prudhoe bay': 'SCC', 'dillingham': 'DLG', 'fairbanks': 'FAI', 'galena': 'GAL',
  'gustavus': 'GST', 'haines': 'HNS', 'homer': 'HOM', 'hoonah': 'HNH', 'juneau': 'JNU', 'kenai': 'ENA', 'ketchikan': 'KTN', 'king salmon': 'AKN',
  'kodiak': 'ADQ', 'kotzebue': 'OTZ', 'nome': 'OME', 'petersburg': 'PSG', 'sitka': 'SIT', 'st. mary\'s': 'KSM', 'unalakleet': 'UNK', 'unalaska': 'DUT',
  'valdez': 'VDZ', 'wrangell': 'WRG', 'yakutat': 'YAK', 'bullhead city': 'IFP', 'flagstaff': 'FLG', 'grand canyon': 'GCN', 'mesa': 'AZA', 'page': 'PGA',
  'peach springs': 'GCW', 'phoenix': 'PHX', 'tucson': 'TUS', 'yuma': 'YUM', 'fayetteville': 'FAY', 'fort smith': 'FSM', 'little rock': 'LIT',
  'texarkana': 'TXK', 'eureka': 'ACV', 'bakersfield': 'BFL', 'burbank': 'BUR', 'carlsbad': 'CLD', 'chico': 'CIC', 'crescent city': 'CEC', 'fresno': 'FAT',
  'long beach': 'LGB', 'los angeles': 'LAX', 'mammoth lakes': 'MMH', 'modesto': 'MOD', 'monterey': 'MRY', 'oakland': 'OAK', 'ontario': 'ONT',
  'palm springs': 'PSP', 'redding': 'RDD', 'sacramento': 'SMF', 'san diego': 'SAN', 'san francisco': 'SFO', 'san jose': 'SJC', 'san luis obispo': 'SBP',
  'santa ana': 'SNA', 'santa barbara': 'SBA', 'santa maria': 'SMX', 'santa rosa': 'STS', 'stockton': 'SCK', 'aspen': 'ASE', 'colorado springs': 'COS',
  'denver': 'DEN', 'durango': 'DRO', 'eagle': 'EGE', 'grand junction': 'GJT', 'gunnison': 'GUC', 'hayden': 'HDN', 'montrose': 'MTJ', 'hartford': 'BDL',
  'new haven': 'HVN', 'daytona beach': 'DAB', 'fort lauderdale': 'FLL', 'fort myers': 'RSW', 'gainesville': 'GNV', 'jacksonville': 'OAJ', 'key west': 'EYW',
  'melbourne': 'MLB', 'miami': 'MIA', 'orlando': 'MCO', 'sanford': 'SFB', 'panama city beach': 'ECP', 'pensacola': 'PNS', 'punta gorda': 'PGD',
  'sarasota': 'SRQ', 'st. augustine': 'UST', 'st. petersburg': 'PIE', 'tallahassee': 'TLH', 'tampa': 'TPA', 'valparaiso': 'VPS', 'west palm beach': 'PBI',
  'albany': 'ALB', 'atlanta': 'ATL', 'augusta': 'AGS', 'brunswick': 'BQK', 'columbus': 'LCK', 'savannah': 'SAV', 'valdosta': 'VLD', 'hilo': 'ITO',
  'honolulu': 'HNL', 'kahului': 'OGG', 'kailua-kona': 'KOA', 'kaunakakai': 'MKK', 'lanai city': 'LNY', 'lihue': 'LIH', 'boise': 'BOI', 'hailey': 'SUN',
  'idaho falls': 'IDA', 'lewiston': 'LWS', 'pocatello': 'PIH', 'twin falls': 'TWF', 'belleville': 'BLV', 'bloomington': 'BMI', 'champaign urbana': 'CMI',
  'chicago': 'ORD', 'chicago midway': 'MDW', 'marion': 'MWA', 'moline': 'MLI', 'peoria': 'PIA', 'quincy': 'UIN', 'rockford': 'RFD', 'springfield': 'SGF',
  'evansville': 'EVV', 'fort wayne': 'FWA', 'indianapolis': 'IND', 'south bend': 'SBN', 'cedar rapids': 'CID', 'des moines': 'DSM', 'dubuque': 'DBQ',
  'sioux city': 'SUX', 'waterloo': 'ALO', 'garden city': 'GCK', 'manhattan': 'MHK', 'wichita': 'ICT', 'covington': 'CVG', 'lexington': 'LEX',
  'louisville': 'SDF', 'owensboro': 'OWB', 'paducah': 'PAH', 'alexandria': 'AEX', 'baton rouge': 'BTR', 'lafayette': 'LFT', 'lake charles': 'LCH',
  'monroe': 'MLU', 'new orleans': 'MSY', 'shreveport': 'SHV', 'bangor': 'BGR', 'bar harbor': 'BHB', 'portland': 'PDX', 'presque isle': 'PQI',
  'rockland': 'RKD', 'baltimore': 'BWI', 'salisbury': 'SBY', 'hagerstown': 'HGR', 'boston': 'BOS', 'hyannis': 'HYA', 'nantucket': 'ACK', 'provincetown': 'PVC',
  'vineyard haven': 'MVY', 'worcester': 'ORH', 'alpena': 'APN', 'detroit': 'DTW', 'escanaba': 'ESC', 'flint': 'FNT', 'grand rapids': 'GRR',
  'hancock': 'CMX', 'iron mountain': 'IMT', 'kalamazoo': 'AZO', 'lansing': 'LAN', 'marquette': 'MQT', 'muskegon': 'MKG', 'pellston': 'PLN',
  'saginaw': 'MBS', 'sault ste. marie': 'CIU', 'traverse city': 'TVC', 'bemidji': 'BJI', 'brainerd': 'BRD', 'duluth': 'DLH', 'hibbing': 'HIB',
  'international falls': 'INL', 'minneapolis': 'MSP', 'rochester': 'ROC', 'st. cloud': 'STC', 'starkville': 'GTR', 'biloxi': 'GPT',
  'hattiesburg': 'PIB', 'jackson': 'JAC', 'columbia': 'CAE', 'joplin': 'JLN', 'kansas city': 'MCI', 'st. louis': 'STL', 'billings': 'BIL',
  'bozeman': 'BZN', 'butte': 'BTM', 'great falls': 'GTF', 'helena': 'HLN', 'kalispell': 'FCA', 'missoula': 'MSO', 'grand island': 'GRI',
  'kearney': 'EAR', 'lincoln': 'LNK', 'omaha': 'OMA', 'scottsbluff': 'BFF', 'boulder city': 'BLD', 'elko': 'EKO', 'las vegas': 'LAS', 'reno': 'RNO',
  'lebanon': 'LEB', 'manchester': 'MHT', 'portsmouth': 'PSM', 'atlantic city': 'ACY', 'trenton': 'TTN', 'newark': 'EWR', 'albuquerque': 'ABQ',
  'farmington': 'FMN', 'hobbs': 'HOB', 'roswell': 'ROW', 'santa fe': 'SAF', 'binghamton': 'BGM', 'buffalo': 'BUF', 'elmira': 'ELM', 'islip': 'ISP',
  'ithaca': 'ITH', 'new york': 'LGA', 'newburgh': 'SWF', 'niagara falls': 'IAG', 'plattsburgh': 'PBG', 'syracuse': 'SYR', 'watertown': 'ART',
  'white plains': 'HPN', 'asheville': 'AVL', 'charlotte': 'CLT', 'greensboro': 'GSO', 'greenville': 'PGV', 'new bern': 'EWN', 'raleigh': 'RDU',
  'wilmington': 'ILM', 'bismarck': 'BIS', 'dickinson': 'DIK', 'fargo': 'FAR', 'grand forks': 'GFK', 'minot': 'MOT', 'williston': 'ISN', 'akron': 'CAK',
  'cincinnati': 'LUK', 'cleveland': 'CLE', 'dayton': 'DAY', 'toledo': 'TOL', 'youngstown': 'YNG', 'lawton': 'LAW', 'oklahoma city': 'OKC', 'tulsa': 'TUL',
  'eugene': 'EUG', 'klamath falls': 'LMT', 'medford': 'MFR', 'north bend': 'OTH', 'redmond': 'RDM', 'allentown': 'ABE', 'erie': 'ERI', 'harrisburg': 'MDT',
  'latrobe': 'LBE', 'philadelphia': 'PHL', 'pittsburgh': 'PIT', 'state college': 'SCE', 'scranton': 'AVP', 'williamsport': 'IPT', 'block island': 'BID',
  'providence': 'PVD', 'westerly': 'WST', 'charleston': 'CRW', 'florence': 'FLO', 'greer': 'GSP', 'hilton head island': 'HHH', 'myrtle beach': 'MYR',
  'aberdeen': 'ABR', 'pierre': 'PIR', 'rapid city': 'RAP', 'sioux falls': 'FSD', 'kingsport': 'TRI', 'chattanooga': 'CHA', 'knoxville': 'TYS',
  'memphis': 'MEM', 'nashville': 'BNA', 'abilene': 'ABI', 'amarillo': 'AMA', 'austin': 'AUS', 'port arthur': 'BPT', 'brownsville': 'BRO',
  'college station': 'CLL', 'corpus christi': 'CRP', 'dallas': 'DAL', 'dallas-fort worth': 'DFW', 'del rio': 'DRT', 'el paso': 'ELP', 'fort hood': 'GRK',
  'harlingen': 'HRL', 'houston': 'HOU', 'laredo': 'LRD', 'longview': 'GGG', 'lubbock': 'LBB', 'mcallen': 'MFE', 'midland': 'MAF', 'san angelo': 'SJT',
  'san antonio': 'SAT', 'tyler': 'TYR', 'waco': 'ACT', 'wichita falls': 'SPS', 'provo': 'PVU', 'salt lake city': 'SLC', 'beaver': 'SGU', 'wendover': 'ENV',
  'burlington': 'BTV', 'charlottesville': 'CHO', 'lynchburg': 'LYH', 'newport news': 'PHF', 'norfolk': 'ORF', 'richmond': 'RIC', 'roanoke': 'ROA',
  'staunton': 'SHD', 'washington dc': 'DCA', 'bellingham': 'BLI', 'friday harbor': 'FRD', 'pasco': 'PSC', 'port angeles': 'CLM', 'pullman': 'PUW',
  'seattle': 'SEA', 'spokane': 'GEG', 'walla walla': 'ALW', 'wenatchee': 'EAT', 'yakima': 'YKM', 'clarksburg': 'CKB', 'huntington': 'HTS',
  'lewisburg': 'LWB', 'morgantown': 'MGW', 'appleton': 'ATW', 'eau claire': 'EAU', 'green bay': 'GRB', 'la crosse': 'LSE', 'madison': 'MSN',
  'milwaukee': 'MKE', 'mosinee': 'CWA', 'rhinelander': 'RHI', 'casper': 'CPR', 'cheyenne': 'CYS', 'cody': 'COD', 'gillette': 'GCC', 'riverton': 'RIW',
  'rock springs': 'RKS', 'sheridan': 'SHR', 'pago pago': 'PPG', 'agana': 'GUM', 'obyan': 'SPN', 'rota island': 'ROP', 'aguadilla': 'BQN', 'ceiba': 'NRR',
  'ponce': 'PSE', 'san juan': 'SJU', 'vieques': 'VQS', 'charlotte amalie': 'STT', 'christiansted': 'STX'};

  if (cityMapping[location.toLowerCase()]) {
    return cityMapping[location.toLowerCase()];
  }

  // Maybe this is a TLA?
  if (location.length == 3) {
    return location.toUpperCase();
  }

  // Sorry, don't know this one
  return null;
}

