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
  
  // console.log("see serialport", SerialPort);
  
  let imgTag, divTag;
  pausedPrint = 1 - pausedPrint; //toggle status  
  
  if(pausedPrint){
    document.getElementById('snapshotBtn').value = "Resume"
    
    imgTag = "firstImg";
    divTag = "results1";
  }
  else {
    document.getElementById('snapshotBtn').value = "Pause Print"
    
    imgTag = "secondImg";
    divTag = "results2";
    
  } //EO-if
  
  // newCallback(imgTag, divTag, ()=>{
  //   doImageProcessing();
  // })
  
  Webcam.snap( (data_uri) => {
  
    capturedImgOjects.push(data_uri);
    document.getElementById(divTag).innerHTML = 
      'Captured image:' + 
      '<img src="'+data_uri+'" id="'+imgTag+'"/>';
  } );
}

// function newCallback(imgId, divId, callback){ //pausedPrint is a dummy param
  
  // Webcam.snap( (data_uri) => {
  // 
  //   capturedImgOjects.push(data_uri);
  //   document.getElementById(divId).innerHTML = 
  //     'Captured image:' + 
  //     '<img src="'+data_uri+'" id="'+imgId+'"/>';
  // } );
  // if(document.getElementById('secondImg')){
  //   console.log(document.getElementById('secondImg'))
  //   callback();
  // }
// }

function doImageProcessing(){
  
    if(document.getElementById('firstImg') && document.getElementById('secondImg')){
      let imgFirst = cv.imread(firstImg);
      let imgSecnd = cv.imread(secondImg);

      //params to operate subtract
      let dst = new cv.Mat();
      let mask = new cv.Mat();
      let dtype = -1;
      
      //params to findcontours
      let dst1 = cv.Mat.zeros(imgFirst.cols, imgFirst.rows, cv.CV_8UC3);
      let dst2 = cv.Mat.zeros(imgSecnd.cols, imgSecnd.rows, cv.CV_8UC3);
      //let dst = new cv.Mat();
      
      cv.cvtColor(imgFirst, imgFirst, cv.COLOR_RGBA2GRAY, 0);
      cv.cvtColor(imgSecnd, imgSecnd, cv.COLOR_RGBA2GRAY, 0);
      
      cv.threshold(imgFirst, imgFirst, 120, 200, cv.THRESH_BINARY);
      cv.threshold(imgSecnd, imgSecnd, 120, 200, cv.THRESH_BINARY);
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      
      cv.findContours(imgFirst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
      cv.findContours(imgSecnd, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
      
      //find contours for both images
      for (let i = 0; i < contours.size(); ++i) {
        //random colors
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                              Math.round(Math.random() * 255));
        cv.drawContours(dst1, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
      }
      
      for (let i = 0; i < contours.size(); ++i) {
        //random colors
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                              Math.round(Math.random() * 255));
        cv.drawContours(dst2, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
      }


      cv.subtract(dst1, dst2, dst, mask, dtype);
      
      // let s = new cv.Scalar(255, 0, 0, 255);
      // cv.copyMakeBorder(imgFirst, dst, 10, 10, 10, 10, cv.BORDER_CONSTANT, s);

      cv.imshow('subtResult', dst);
      dst.delete();
      // cv.waitKey();
    }
}
