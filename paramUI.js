//should be global

var lrScaleUIAdded = false, topScaleUIAdded = false, modelLoaded = false;
var leftBoxUI, rightBoxUI, topBoxUI;

var port;

var settings = {
  model: {
    'x': 1.0,
    'y': 1.0,
    'z': 1.0
  },
  modelScale: 1.0,
  leftBbox: {
    'x': 1.0,
    'y': 1.0,
    'z': 1.0
  },
  rightBbox: {
    'x': 1.0,
    'y': 1.0,
    'z': 1.0
  },
  topBbox: {
    'x': 1.0,
    'y': 1.0,
    'z': 1.0
  }
}
var panel = new dat.GUI();

var params = {
  loadFile: function(){
    // document.getElementById("myInput").click();
    // var stlMesh = loadSTLModel('./models/android.stl', 'ascii');
    // 
    //   if( stlMesh ){
    //     scene.add( stlMesh );
    //     objects.push( stlMesh ); //objects from editor
    // 
    //     panel.add(settings, 'modelScale', -10, 10, 0.1).onChange(function(){
    //       console.log("stl Mesh: ", stlMesh)
    //       stlMesh.scale.set(settings.modelScale, settings.modelScale, settings.modelScale);
    //     });
    //   }
  },

  connect:function() {
    port = new SerialPort('/dev/usbmodem1421'); //immediately opens a port

    port.write('main screen turn on', function(err){
      if (err){
        return console.log('Error on write:', err.message);
      }
      console.log('message written');
    });
  },

  export: function(){
    console.log("export stl")
  }
}
// var modelUI = panel.addFolder( 'Model Scale' );


function createPanel(){
  //file upload
  panel.add(params, 'loadFile').name('Load 3D Model');
  panel.add(params, 'connect').name('Connect to Printer');
  panel.add(params, 'export').name('Export to STL');

  // modelUI.open();
}


function removePanel(gearType){
  topBoxUI.close();
  delete topBoxUI;
}