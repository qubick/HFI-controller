var capturedImgOjects = [];
var pausedPrint = false;
// configure
Webcam.set({
  width: 320,
  height: 240,
  image_format: 'jpeg',
  jpeg_quality: 90
});
Webcam.attach( '#cam' );


function take_snapshot() {
  
  pausedPrint = 1 - pausedPrint; //toggle status  
  if(pausedPrint){
    document.getElementById('snapshotBtn').value = "Resume"
    
    Webcam.snap( (data_uri)=> {
      
      capturedImgOjects.push(data_uri);
      document.getElementById('results1').innerHTML = 
        'Captured image1:' + 
        '<img src="'+data_uri+'"/>';
    } );  
  }
  else {
    document.getElementById('snapshotBtn').value = "Pause Print"
    
    Webcam.snap( (data_uri)=> {
      
      capturedImgOjects.push(data_uri);
      document.getElementById('results2').innerHTML = 
        'Captured image2:' + 
        '<img src="'+data_uri+'" id="aa2"/>';
    } );
    
    //now we have two images
    
    let mat2 = cv.imread(id);
    console.log("mat1: ", mat1)
    cv.imshow('canvasOutput', mat1);
  }
}