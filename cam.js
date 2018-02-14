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
    
    //if in the middle of printing, completes the entire layer
    
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
      
      //grabCut to detect foreground
      cv.cvtColor(imgSecnd, imgSecnd, cv.COLOR_RGBA2RGB, 0);
      let bgdModel = new cv.Mat();
      let fgdModel = new cv.Mat();
      let rect = new cv.Rect(50,10,200,200); //set to printing base size shown in the cam
      cv.grabCut(imgSecnd, mask, rect, bgdModel, fgdModel, 1, cv.GC_INIT_WITH_RECT);
      
      //draw foreground for img1
      for(let i=0; i<imgFirst.rows; i++){
        for(let j=0; j<imgFirst.cols; j++){
          if(mask.ucharPtr(i,j)[0] === 0 || mask.ucharPtr(i,j)[0] === 2){
            imgFirst.ucharPtr(i,j)[0] = 255;
            imgFirst.ucharPtr(i,j)[1] = 255;
            imgFirst.ucharPtr(i,j)[2] = 255;
          }
        }
      }
      
      //draw foreground for img2
      for(let i=0; i<imgSecnd.rows; i++){
        for(let j=0; j<imgSecnd.cols; j++){
          if(mask.ucharPtr(i,j)[0] === 0 || mask.ucharPtr(i,j)[0] === 2){
            imgSecnd.ucharPtr(i,j)[0] = 255;
            imgSecnd.ucharPtr(i,j)[1] = 255;
            imgSecnd.ucharPtr(i,j)[2] = 255;
          }
        }
      }
      
      //draw grab Rect
      // let color   = new cv.Scalar(0,0,255);
      // let point1  = new cv.Point(rect.x, rect.y);
      // let point2  = new cv.Point(rect.x + rect.width, rect.y + rect.height);
      // cv.rectangle(imgFirst, point1, point2, color);
      // cv.rectangle(imgSecnd, point1, point2, color);
      cv.imshow('foreground1', imgFirst);
      cv.imshow('foreground2', imgSecnd);
      
      //thresholding to find difference      
      cv.cvtColor(imgFirst, imgFirst, cv.COLOR_RGBA2GRAY, 0);
      cv.cvtColor(imgSecnd, imgSecnd, cv.COLOR_RGBA2GRAY, 0);
      cv.threshold(imgFirst, imgFirst, 100, 200, cv.THRESH_BINARY);
      cv.threshold(imgSecnd, imgSecnd, 100, 200, cv.THRESH_BINARY);
  
      
      cv.subtract(imgSecnd, imgFirst, dst, mask, dtype);
      // cv.imshow('substResult1', dst);
      
      // find contour for extracted forground images
      let newDst = cv.Mat.zeros(dst.cols, dst.rows, cv.CV_8UC3);
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      // 
      cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
      for (let i = 0; i < contours.size(); ++i) {
        //random colors
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                              Math.round(Math.random() * 255));
        cv.drawContours(newDst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
      }
      
      cv.imshow('substResult2', newDst);
      dst.delete();
      newDst.delete();
    }
}
