var fs = require("fs");
var parser = require('./parseGcode.js');
// var CSG = require('../build/csg.js');
var Victor = require('victor');

var gcodeMvmt = parser.gcodeWallMvmt;


function ApplyTransformation(transformType){

  console.log("gcdoeMvmt size: ", gcodeMvmt.length);

  gcodeMvmt.forEach((line) => {
    // var tempVect = new CSG.Vector({x: line.x, y: line.y, z: line.z});
    var vec = Victor.fromObject(line.pos); // pos : {x: , y: }

    if(transformType === 'rotate'){
      vec.rotateBy(Math.PI/4);
    };
    if(transformType === 'scale'){

    };
    if(transformType === 'sine'){

    };

    var newLine = 'G1 X' + vec.x + ' Y' + vec.y + ' Z'+ line.z + ' E' + line.e + '\n';
    fs.appendFile('./assets/interpolatedPoints.gcode', newLine, (err)=>{
      if(err) console.log(err);
    });
    console.log("curr temp vector: ", newLine);

  });


}

module.exports = {
  ApplyTransformation: ApplyTransformation
}
