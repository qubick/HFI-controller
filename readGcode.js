var gcodeObject = [];

var openFile = function(event) {

  var input = event.target;

  var reader = new FileReader();
  
  reader.onload = function(){
    var text = reader.result;
    // var node = document.getElementById('output');
    // node.innerText = text;
    
    var lines = this.result.split('\n');
    console.log("# of lines: ", lines.length);
    // console.log(reader.result.substring(0, 200)); //test printer
    var z = 0; //base height
    
    lines.forEach((line) => {
      var chunk = line.split(' ');
      var reX = /X\d+.\d+/;
      var reY = /Y\d+.\d/;
      var reZ = /Z\d+.\d/;
      
      
      var dummyZ = line.match(reZ);
      
      if(dummyZ){ //otherwise keep the latest z-height
        z = dummyZ[0].substr(1);
      }
      if(chunk[0] === ('G0' || 'G1')){
        var x = line.match(reX)[0].substr(1);
        var y = line.match(reY)[0].substr(1);
        mvmt = {
          x : x,
          y : y,
          z : z
        }
        gcodeObject.push(mvmt);
        slicingGeometry.vertices.push(new THREE.Vector3(mvmt.x, mvmt.y, mvmt.z))
        
        console.log(mvmt);
      }
    });
    // drawLine(); //now it's callstack err
  };
  reader.readAsText(input.files[0]);
}

function gcodeParser(){
  
}