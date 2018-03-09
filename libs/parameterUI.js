//should be global

var lrScaleUIAdded = false, topScaleUIAdded = false, modelLoaded = false;
var leftBoxUI, rightBoxUI, topBoxUI;

var channel = new Channel("general"); // this is for general communication w/ server

var panel = new dat.GUI();

var Params = function(){
  this.loadFile = function(){

    document.getElementById('loadFileInput').click(); //bind file opener
  };

  this.print = function() {

    // gcodeWallMvmt.map((mvmtCmds)=>{ //map() is asynchronous
    //   console.log("see this is asynchronous: ", mvmtCmds);
    //   channel.postMessage(mvmtCmds); //send line by line
    // })
    var msgCommand = {
      msg: "start"
      ,file: gcodeFileName //it's determined at fileLoader in gcodeparser
    }
    channel.postMessage(msgCommand); //this is bulk send

    channel.onmessage = function(evt){
      console.log(evt.data); //check what is evt
    }
  };


  //this is for debug to see if contourline is self-intersecting
  this.see2DPath = function(){

    console.log('Check if lines are self-intersecting...')

    curveFromCam.forEach((polyVertex) => {
      console.log('x: ', polyVertex.x*10, 'y: ', polyVertex.y*10);
      contourLineGeometry.vertices.push(new THREE.Vector3(polyVertex.x*100, polyVertex.y*100, 0)); //since our grid is at (0, -100)
    });

    var path2D = new THREE.Line(slicingGeometry, lineMaterial);
    scene.add(path2D);
    render();

  }

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
  panel.add(params, 'print').name('Start printing'); //this is now connected to the spiralization
  // panel.add(params, 'see2DPath').name('See contourline from image');
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
