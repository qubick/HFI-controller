//should be global

var lrScaleUIAdded = false, topScaleUIAdded = false, modelLoaded = false;
var leftBoxUI, rightBoxUI, topBoxUI;


var settings = {
}
var panel = new dat.GUI();

var params = {
  loadFile: function(){
    
    document.getElementById('myInput').click(); //bind file opener

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