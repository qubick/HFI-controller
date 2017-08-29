//should be global

var lrScaleUIAdded = false, topScaleUIAdded = false, modelLoaded = false;
var leftBoxUI, rightBoxUI, topBoxUI;

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

    // if( !modelLoaded ){
      modelUI.add( settings.model, 'x', 0, 360, 1).listen();//.onFinishCahnge(()=>{}); //then update model scale
      modelUI.add( settings.model, 'y', 0, 360, 1).listen();
      modelUI.add( settings.model, 'z', 0, 360, 1).listen();
    //   modelLoaded = true;
    // }
  },
  Kinemake:function() {
    console.log("clicked")
  },
  export: function(){
    console.log("export stl")
  }
}

var panel = new dat.GUI();

var modelUI = panel.addFolder( 'Model Rotation' );


function createPanel(){
  //file upload
  panel.add(params, 'loadFile').name('Load 3D Model');
  panel.add(params, 'Kinemake');
  panel.add(params, 'export').name('Export to STL');

  modelUI.open();
}

function addLRScalePanel(gearType){
  if( !lrScaleUIAdded ){

    leftBoxUI = panel.addFolder( 'Scale Left BoudingBox' );
    rightBoxUI = panel.addFolder( 'Scale Right BoudingBox' );

    leftBoxUI.add( settings.topBbox, 'x', 0, 5).name('Width').listen(); //then update model scale
    leftBoxUI.add( settings.topBbox, 'y', 0, 5).name('Height').listen();
    leftBoxUI.add( settings.topBbox, 'z', 0, 5).name('Length').listen();

    rightBoxUI.add( settings.topBbox, 'x', 0, 5).name('Width').listen(); //then update model scale
    rightBoxUI.add( settings.topBbox, 'y', 0, 5).name('Height').listen();
    rightBoxUI.add( settings.topBbox, 'z', 0, 5).name('Length').listen();

    leftBoxUI.open();
    rightBoxUI.open();

    lrScaleUIAdded = true;
  }
}

function addTopScalePanel(gearType){

  if( !topScaleUIAdded ){
    topBoxUI = panel.addFolder( 'Scale Top BoundingBox' );

    topBoxUI.add( settings.topBbox, 'x', 0, 5).name('Width').listen(); //then update model scale
    topBoxUI.add( settings.topBbox, 'y', 0, 5).name('Height').listen();
    topBoxUI.add( settings.topBbox, 'z', 0, 5).name('Length').listen();

    topBoxUI.open();

    topScaleUIAdded = true;
  }
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
