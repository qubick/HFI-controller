var parser = require('./parseGcode.js');
// var CSG = require('../build/csg.js');
var Victor = require('victor');

var gcodeMvmt = parser.gcodeWallMvmt;


function ApplyTransformation(transformType){

  console.log("gcdoeMvmt size: ", gcodeMvmt.length);

  gcodeMvmt.forEach((line) => {
    // var tempVect = new CSG.Vector({x: line.x, y: line.y, z: line.z});

    // var vec = new Victor(line.x, line.y);
    var vec = Victor.fromObject(line.pos);
    vec.rotateBy(Math.PI/4);

    var newLine = "G1 X" + vec.x + " Y" + vec.y + " E" + line.e;
    console.log("curr temp vector: ", vec.toString());
  });

  if(transformType === 'rotation');
  if(transformType === 'scale');
  if(transformType === 'sine');
}

module.exports = {
  ApplyTransformation: ApplyTransformation
}
