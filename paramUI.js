//should be global

var lrScaleUIAdded = false, topScaleUIAdded = false, modelLoaded = false;
var leftBoxUI, rightBoxUI, topBoxUI;


// var settings = {
//   layer = 0.0;
// }

var panel = new dat.GUI();

var Params = function(){
  this.loadFile = function(){
    
    document.getElementById('loadFileInput').click(); //bind file opener
  };

  this.print = function() {
    
    // var xhr = new XMLHttpRequest();
    // var channelURL = "http://localhost:8080"; //for now
    // xhr.open("POST", channelURL);
    // xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // 
    // xhr.send(gcodeWallMvmt); //this is too large
    var channel = new Channel("general");
    // gcodeWallMvmt.map((mvmtCmds)=>{ //map() is asynchronous
    //   console.log("see this is asynchronous: ", mvmtCmds);
    //   channel.postMessage(mvmtCmds); //send line by line
    // })
    var msgCommand = "start"
    channel.postMessage(msgCommand); //this is bulk send
    
    channel.onmessage = function(evt){
      console.log(evt.data); //check what is evt
    }
  };

  this.export = function(){
    console.log("export stl")
  };
  this.layer = 0.0
}
// var modelUI = panel.addFolder( 'Model Scale' );


function createPanel(){
  //file upload
  var params = new Params();
  panel.add(params, 'loadFile').name('Load 3D Model');
  panel.add(params, 'print').name('Start printing');
  // panel.add(params, 'export').name('Export to STL');
  panel.add(params, 'layer', 0, 300).name('See layers').listen(()=>{
  //   for(let i=0; i<layerNumber; i++){
  //     slicingGeometry.vertices.push(new THREE.Vector3(mvmt[i].x, mvmt[i].y-100, mvmt[i].z)); //since our grid is at (0, -100)
  //   }
  //   var line3D = new THREE.Line(slicingGeometry, lineMaterial);
  //   scene.add(line3D);
  // 
  }); //get the layer number from gcode reader
}

function removePanel(){
  delete topBoxUI;
}