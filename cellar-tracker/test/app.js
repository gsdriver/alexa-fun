var wineO = require('../src/CellarTracker');

// Read the list of wines
function myWineFunc(error, wineList)
{
    // Just for fun, print out wines sorted by score
    wineList.wines.sort(function(a,b){return b.CT-a.CT;});
    wineList.wines.forEach(wine => {if (wine.CT) { console.log(wine.Wine + " with score " + wine.CT); } });
}

wineO.ReadWineList(myWineFunc);
