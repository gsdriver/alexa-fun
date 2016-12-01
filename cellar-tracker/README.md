# celler-tracker
An Alexa skill that plugs into CellarTracker to allow you to pick a wine from your cellar
Because there isn't a public API (rather, you need to pass your credentials in a URL call 
to retrieve a CSV of your holdings), this skill will likely not be published in its current
form.  I may add in account linking at some point, but because of the need to pass credentials
in a URL, it would not be a very secure solution.

When searching for a wine, you can ask for wines filtered by varietal, or by groups such as
"big red" or "light white."  You can also ask for older wines, high-scoring wines,
ones that are past or nearing their drinkability date, or ones that you have more than 
one of in your cellar.
