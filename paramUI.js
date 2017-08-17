//should be global

var settings_model = {
    'x': 0.0,
    'y': 0.0,
    'z': 0.0
}

function createPanel(){
  //get type of gear

  var panel = new dat.GUI( { width: 310});

  var folder1 = panel.addFolder( 'Model Rotation' );
  var folder2 = panel.addFolder( 'Left BoudingBox' );
  var folder3 = panel.addFolder( 'Right BoudingBox' );

  folder1.add( settings_model, 'x', 0, 360, 1); //then update model scale
  folder1.add( settings_model, 'y', 0, 360, 1);
  folder1.add( settings_model, 'z', 0, 360, 1);

  folder1.open();

  // if(numBbox === 3){
  //   var folder4 = panel.addFolder( 'TopBoudingBox' );
  //   folder4.open();
  // }
}
