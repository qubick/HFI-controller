//should be global

var settings = {
  model: {
    'x': 0.0,
    'y': 0.0,
    'z': 0.0
  },
  leftBbox: {
    'x': 0.0,
    'y': 0.0,
    'z': 0.0
  },
  rightBbox: {
    'x': 0.0,
    'y': 0.0,
    'z': 0.0
  },
  topBbox: {
    'x': 0.0,
    'y': 0.0,
    'z': 0.0
  }
}

var params = {
  loadFile: function(){
    document.getElementById("myInput").click();
    loadSTLModel('./models/makefairbot.stl', 'ascii');
  },
  Kinemake:function() {
    console.log("clicked")
  }
}

var panel = new dat.GUI();

var modelUI = panel.addFolder( 'Model Rotation' );
var leftBoxUI = panel.addFolder( 'Scale Left BoudingBox' );
var rightBoxUI = panel.addFolder( 'Scale Right BoudingBox' );
var topBoxUI = panel.addFolder( 'Scale Top BoundingBox' );


function createPanel(){
  //file upload
  panel.add(params, 'loadFile').name('Load 3D Model');

  // panel.add(parms, ) //'kinemake' button
  //model params
  modelUI.add( settings.model, 'x', 0, 360, 1).listen();//.onFinishCahnge(()=>{}); //then update model scale
  modelUI.add( settings.model, 'y', 0, 360, 1).listen();
  modelUI.add( settings.model, 'z', 0, 360, 1).listen();

  // var obj = { Kinemake:function() { console.log("clicked") }};
  panel.add(params, 'Kinemake');

  modelUI.open();

}

function addPanel(gearType){

  topBoxUI.add( settings.topBbox, 'x', 0, 5).name('Width').listen(); //then update model scale
  topBoxUI.add( settings.topBbox, 'y', 0, 5).name('Height').listen();
  topBoxUI.add( settings.topBbox, 'z', 0, 5).name('Length').listen();

  topBoxUI.open();
}

function removePanel(gearType){
  topBoxUI.close();
  delete topBoxUI;
}

function showDiv() {
  document.getElementById('bbox_shape').style.display = "block";
  // document.getElementById('loadSTL').style.display = "block";
  // document.getElementById('model_rotation').style.display = "block";
}
