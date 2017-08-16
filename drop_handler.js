function drop_handler(evt){

  console.log("Drop handler loaded");
  evt.preventDefault();

  //If dropped item aren't files, reject them
  var dt = evt.dataTransfer;

  if(dt.items){

    console.log("item loaded")
    for(var i=0; i < dt.items.length; i++){
      if(dt.items[i].kind === 'file'){
        var f = dt.items[i].getAsFile();
        saveAs(f, "sample.stl");
        console.log("...file[" + i + "].name = " + f.name + " saved")
      }
    }
  } else {
    for(var i=0; i < dt.files.length; i++){
      console.log("...file[" + i + "].name = " + dt.files[i].name);
    }
  }
}

function dragover_handler(evt){
  console.log("dragOver");
  evt.preventDefault();
}


function dragend_handler(evt){
  console.log("dragEnd");

  var dt = evt.dataTransfer;
  if(dt.items){
    for(var i=0; i< dt.items.length; i++){
      dt.items.remove(i);
    }
  } else {
    evt.dataTransfer.clearData();
  }
}
