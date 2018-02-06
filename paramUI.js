//should be global

var lrScaleUIAdded = false, topScaleUIAdded = false, modelLoaded = false;
var leftBoxUI, rightBoxUI, topBoxUI;


var settings = {
}
var panel = new dat.GUI();

var params = {
  loadFile: function(){
    
    var material = new THREE.LineBasicMaterial({ color: 0x0000ff});
    var geometry = new THREE.Geometry();
    
    // readGcodeFile("cube.gcode");
    
    // gcodeObject.forEach(vertex){
    //   geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z))
    //   var line = new Three.Line(geometry, material);
    // }
    
    // scene.add(line);
    // renderer.render(scene.camera); //render here?
    
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