// Should reading gcode be done at the server side?
var gcodeFileName;
var layer = [];
var gcodeWallMvmt = [];
var gcodeSkinMvmt = [];
var gcodeSegments = []; //not sure yet if this is essential now

var tmpIdx = 0;

var x = 0, y = 0, z = 0 //movement command
    ,e = 0 //extrusion rate (e stepper)
    ,f = 0 //movement speed & feedrate
    ,s = 0; //temperature

var lines = []; //each line of gcode
var layerCnt = 0, currLayer = 0;

var skin = false, wall = false, fill = false;


//maybe do this from serverside?
exports.parseGcode = function(lines){

  var z = 0; //base height

  lines.forEach((line, i) => {

    if(line.match(/;TYPE:WALL-OUTER/ || /;TYPE:WALL-INNER/)){
      wall = true;
      skin = false;
      fill = false;
    }
    else if(line.match(/;TYPE:SKIN/)){
      wall = false;
      skin = true;
      fill = false;
    }
    else if(line.match(/;TYPE:FILL/)){
      skin = false;
      wall = false;
      fill = true;
    }
    else if(line.match(/;LAYER:[0-9]+/)){
      // console.log("layer comment: ", line);
      currLayer = line.replace(';LAYER:', '');
      layerCnt = currLayer;

      var idx = i+1;
      if(lines[idx].charAt(0) === "M") //this is to reduce # of regEx. Only applies to the Cura sliced gcode
        idx += 1;

      gcodeChunks = lines[idx].split(' ');
      if(gcodeChunks[4])
        z = gcodeChunks[4].substr(1);
    }


    if(line.startsWith('G1')){ // || line.startsWith('G0')){  // do only extrusion movement

      var chunk = line.split(' ');

      chunk.forEach((token) => {

        switch (token.charAt(0)) {
          case 'F':
            f = token.substr(1);
            break;
          case 'X':
            x = token.substr(1);
            break;
          case 'Y':
            y = token.substr(1);
          break;
          case 'E':
            e = token.substr(1);
          default:

        } //EOF switch
      }); //EOF chunk.forEach()

        mvmt = {
          "l" : currLayer,
          "x" : x,
          "y" : z,
          "z" : y //it is graphics axis
        }

        if(wall || skin){
          gcodeWallMvmt.push(mvmt);
        }
        if(fill){
          gcodeSkinMvmt.push(mvmt);
        }

        if(gcodeWallMvmt.length > 2 ){
          let len = gcodeWallMvmt.length - 1;
          
          if(gcodeWallMvmt[len].l === gcodeWallMvmt[len-1].l){
            let ax = parseFloat(gcodeWallMvmt[len].x);
            let ay = parseFloat(gcodeWallMvmt[len].y);
            let bx = parseFloat(gcodeWallMvmt[len-1].x);
            let by = parseFloat(gcodeWallMvmt[len-1].y);

            let dist = Math.sqrt((ax-bx)*(ax-bx) + (ay-by)*(ay-by));
            console.log('[Parser]'.blue, 'dist: ', dist);
          }
        }
      } //EOF if line[0] == G1
    });// EOF line.forEach()
} //EOF function
