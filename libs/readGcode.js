// Should reading gcode be done at the server side?

var gcodeFileName;
var layer = [];
var gcodeWallMvmt = [];
var gcodeSkinMvmt = [];
var gcodeSegments = []; //not sure yet if this is essential now
var x = 0, y = 0, z = 0 //movement command
    ,e = 0 //extrusion rate (e stepper)
    ,f = 0 //movement speed & feedrate
    ,s = 0; //temperature

var lines = []; //each line of gcode
var offsetX, offsetY;
var layerCnt = 0, currLayer = 0;

var skin = false, wall = false, fill = false;


var openFile = (event) => { //this is for preview

  var input = event.target;
  var reader = new FileReader();
  gcodeFileName = event.srcElement.files[0].name;

  reader.onload = function(){
    // var text = reader.result; //read file input result (gcode)
    // // var node = document.getElementById('output');
    // // node.innerText = text;
    //
    // do this at the server side
    // lines = this.result.split('\n');
    // parseGcode(lines);
    var msgCommand = {
      "msg": "openFile",
      "filename": gcodeFileName
    }

    channel.postMessage(msgCommand);
  }; //EOF onload()
  reader.readAsText(input.files[0]);
}


//maybe do this from serverside?
function parseGcode(lines){

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
      currLayer = line.replace(';LAYER:', '');
      layerCnt = currLayer;

      var idx = i+1;
      if(lines[idx].charAt(0) === "M") //this is to reduce # of regEx. Only applies to the Cura sliced gcode
        idx += 1;

      gcodeChunks = lines[idx].split(' ');
      if(gcodeChunks[4])
        z = gcodeChunks[4].substr(1);
    }

    //this is common for any type of slicer
    // var zMove = line.match(/Z\d+.\d/);
    //
    // if(zMove){ //otherwise keep the latest z-height
    //   z = zMove[0].substr(1);
    // }

    if(line.startsWith('G1')){ // || line.startsWith('G0')){  // do only extrusion movement

      // var x = line.match(/X\d+.\d+/)[0].substr(1); //maybe regEx is too slow?
      // var y = line.match(/Y\d+.\d+/)[0].substr(1);
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

      if (x && y){
        // if(offsetX === undefined){ //to load center
        //   offsetX = -x;
        //   offsetY = -y;
        // }
        mvmt = { //make this as json object
          "l" : currLayer,
          "x" : x,
          "y" : z,
          "z" : y //it is graphics axis
        }

        if(wall || skin){
          gcodeWallMvmt.push(mvmt);
          slicingGeometry.vertices.push(new THREE.Vector3(mvmt.x, mvmt.y-100, mvmt.z)); //since our grid is at (0, -100)
        }
        if(fill){
          gcodeSkinMvmt.push(mvmt);
          //to previw infills only
          // slicingGeometry.vertices.push(new THREE.Vector3(mvmt.x, mvmt.y-100, mvmt.z)); //since our grid is at (0, -100)
        }

        console.log(mvmt);
      }
    }
  });// EOF line.forEach()

  var line3D = new THREE.Line(slicingGeometry, lineMaterial);
  scene.add(line3D);

}
