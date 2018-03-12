// Should reading gcode be done at the server side?
var gcodeFileName;
var layer = [];

//these are json object with l,x,y,e
var gcodeWallMvmt = [];
var gcodeSkinMvmt = [];
var gcodeFillMvmt = [];
// this is for pure gcode line
var gcodeSegments = [];


const WAVAMPLITUDE = 2;
const CONSTDIST = 10; //this could

var x = 0, y = 0, z = 0 //movement command
    ,e = 0 //extrusion rate (e stepper)
    ,f = 0 //movement speed & feedrate
    ,s = 0; //temperature

var lines = []; //each line of gcode
var layerCnt = 0, currLayer = 0;

var skin = false, wall = false, fill = false;


function parseGcode(lines, callback){
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
      if(lines[idx].charAt(0) === "M"){ //this is to reduce # of regEx. Only applies to the Cura sliced gcode
        idx += 1;
        // still need to save into the integrated gcode
      }

      gcodeChunks = lines[idx].split(' ');
      if(gcodeChunks[4])
        z = gcodeChunks[4].substr(1);
    }
    else if(line.startsWith('G1')){ // || line.startsWith('G0')){  // do only extrusion movement

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
          "l" : currLayer
          , "f" : f
          , "x" : x
          , "y" : y
          // , "z" : z
          , "e" : e
        }
        // let reconstructedLine = "G1 X" + prevX + " Y" + prevY + " E" + e;
        // gcodeSegments.push(reconstructedLine);

        if(wall){
          gcodeWallMvmt.push(mvmt);
        }
        if(skin){ //don't manipulate top/bottom covers for movement
          gcodeSkinMvmt.push(mvmt);
          gcodeSegments.push(line);
        }
        if(fill){
          gcodeFillMvmt.push(mvmt);
          gcodeSegments.push(line);
        }

        if(gcodeWallMvmt.length > 2 ){
          let len = gcodeWallMvmt.length - 1;

          if(gcodeWallMvmt[len].l === gcodeWallMvmt[len-1].l){ //else >> no dist btw layers

            // to interpolate movement
            let ax = parseFloat(gcodeWallMvmt[len-1].x);
            let ay = parseFloat(gcodeWallMvmt[len-1].y);
            let bx = parseFloat(gcodeWallMvmt[len].x);
            let by = parseFloat(gcodeWallMvmt[len].y);
            let dist = Math.sqrt((ax-bx)*(ax-bx) + (ay-by)*(ay-by));

            // to interpolate extrusion rate
            let prevE = parseFloat(gcodeWallMvmt[len-1].e);
            let nextE = parseFloat(gcodeWallMvmt[len].e);
            let interval = parseInt(dist/CONSTDIST); //regular estep mvmt

            let eDelta = (nextE - prevE)/interval;


            //interpolate gaps with more points to add deformation
            let prevX = ax, prevY = ay,
                nextX, nextY;
                eStep = prevE;

            let reconstructedLine = "G1 X" + prevX + " Y" + prevY + " E" + eStep + "\n"; //to save pure gcode file

            if(gcodeWallMvmt.f){
              let flowRate = 'F' + gcodeWallMvmt.f + ' X';
              reconstructedLine.replace('X', flowRate);
            }

            gcodeSegments.push(reconstructedLine);

            while (dist > CONSTDIST){
              let theta = Math.atan(Math.abs(by-ay)/Math.abs(ax-bx));

              if(prevX < nextX)
								prevX = prevX + CONSTDIST * Math.cos(theta);
							else if (prevX > nextX)
								prevX = prevX - CONSTDIST * Math.cos(theta);

              if(prevY < nextY)
								prevY = prevY + CONSTDIST * Math.sin(theta)
							else if(prevY > nextY)
								prevY = prevY - CONSTDIST * Math.sin(theta)

              dist -= CONSTDIST;
              eStep += eDelta; //segment estep mvmt by # of added interval

              //add new discrete pts to the array
              mvmt = {
                "l" : currLayer
                , "x" : prevX
                , "y" : prevY
                // , "z" : z
                , "e" : eStep
                //need to decide how to get the flowrate? (e-stepper motor speed)
              }

              gcodeWallMvmt.push(mvmt);
              let reconstructedLine = "G1 X" + prevX + " Y" + prevY + " E" + eStep + "\n";
              gcodeSegments.push(reconstructedLine);
            }
          }
        }
      } //EOF if line[0] == G1
      else { //no match with G1 mvmt or commentline(;)
        gcodeSegments.push(line);
      }
    });// EOF line.forEach()

    console.log("gcode wall movement size:", gcodeWallMvmt.length);

    // for(var o = 0; o <200; o++){
    //   console.log(gcodeSegments[o]);
    // }

    callback();
} //EOF function


module.exports = {
  parseGcode: parseGcode,
  layer: layer,
  gcodeWallMvmt: gcodeWallMvmt,
  gcodeSkinMvmt: gcodeSkinMvmt,
  gcodeFillMvmt: gcodeFillMvmt,
  gcodeSegments: gcodeSegments
};
