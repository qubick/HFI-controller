var string = "G21 X105.33 Y125.22"

//var reX = /X[0-9]+/;

//var x = string.match(reX);


var chunk = string.split(' ');
console.log(chunk.indexOf("X"));
