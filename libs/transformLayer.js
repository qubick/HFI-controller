var parser = require('./parseGcode.js');
var CSG = require('../build/csg.js');

var gcodeMvmt = parser.gcodeWallMvmt;


function ApplyTransformation(transformType){

  console.log("gcdoeMvmt size: ", gcodeMvmt.length);

  gcodeMvmt.forEach((line) => {
    // var tempVect = new CSG.Vector({x: line.x, y: line.y, z: line.z});
    var tempVect = {x: line.x, y: line.y, z: line.z};
    console.log("curr temp vector: ", tempVect);
  });

  if(transformType === 'rotation');
  if(transformType === 'scale');
  if(transformType === 'sine');
}

module.exports = {
  ApplyTransformation: ApplyTransformation
}
