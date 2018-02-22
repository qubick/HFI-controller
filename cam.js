var capturedImgOjects = [];
var pausedPrint = false;
var capturedforExtraction = false;

//common vars for CV
let rect = new cv.Rect(50,20,200,180); //set to printing base size shown in the cam
const areaThreshold = 100;
const areaMaxSize = 6000;

let scaleFactorToBedSize = 10;

// configure
Webcam.set({
  width: 320,
  height: 240,
  image_format: 'jpeg',
  jpeg_quality: 90
});
Webcam.attach( '#cam' );


function take_snapshot() {

  let imgTag, divTag;
  var msgCommand = {};

  pausedPrint = 1 - pausedPrint; //toggle status

  if(pausedPrint){
    document.getElementById('snapshotBtn').value = "Resume"
    imgTag = "firstImg";
    divTag = "results1";

    //if in the middle of printing, completes the entire layer
    msgCommand["msg"] = "paused"
  }
  else {
    document.getElementById('snapshotBtn').value = "Pause Print"
    imgTag = "secondImg";
    divTag = "results2";

    msgCommand["msg"] = "printing"
  } //EO-if

  channel.postMessage(msgCommand);

  Webcam.snap( (data_uri) => {

    capturedImgOjects.push(data_uri);
    document.getElementById(divTag).innerHTML =
      'Captured image:' +
      '<img src="'+data_uri+'" id="'+imgTag+'"/>';
  } );
}

function doImageProcessing(){

    if(document.getElementById('firstImg') && document.getElementById('secondImg')){
      let imgFirst = cv.imread(firstImg);
      let imgSecnd = cv.imread(secondImg);

      let dst = new cv.Mat(); //subtraction destination
      let mask = new cv.Mat();
      let dtype = -1;

      //grabCut to detect foreground
      cv.cvtColor(imgFirst, imgFirst, cv.COLOR_RGBA2RGB, 0);
      cv.cvtColor(imgSecnd, imgSecnd, cv.COLOR_RGBA2RGB, 0);
      let bgdModel = new cv.Mat();
      let fgdModel = new cv.Mat();
      cv.grabCut(imgFirst, mask, rect, bgdModel, fgdModel, 1, cv.GC_INIT_WITH_RECT);
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

      //thresholding of the foreground detected imgs to find difference
      cv.cvtColor(imgFirst, imgFirst, cv.COLOR_RGBA2GRAY, 0);
      cv.cvtColor(imgSecnd, imgSecnd, cv.COLOR_RGBA2GRAY, 0);
      cv.threshold(imgFirst, imgFirst, 100, 200, cv.THRESH_BINARY);
      cv.threshold(imgSecnd, imgSecnd, 100, 200, cv.THRESH_BINARY);

      cv.subtract(imgSecnd, imgFirst, dst, mask, dtype);
      cv.imshow('substResult1', dst);

      // find contour for extracted forground images
      let newDst = cv.Mat.zeros(dst.cols, dst.rows, cv.CV_8UC3);
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();

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

function captureToExtractSketch(){
  if(!capturedforExtraction){
    document.getElementById('extractBtn').value = "Extract Image"
    Webcam.snap( (data_uri) => {

      capturedImgOjects.push(data_uri);
      document.getElementById("results1").innerHTML =
        '<img src="'+data_uri+'" id="imgSketchExtraction"/>';
    });
  }
  else{
    document.getElementById('extractBtn').value = "Capture Sketch"
    doSketchExtraction();
  }
  capturedforExtraction = 1 - capturedforExtraction; //toggle
}

function doSketchExtraction(){

  let extractImg = cv.imread(imgSketchExtraction);

  //params to operate subtract
  let mask = new cv.Mat();
  let bgdModel = new cv.Mat();
  let fgdModel = new cv.Mat();

  //foreground detection
  cv.cvtColor(extractImg, extractImg, cv.COLOR_RGBA2RGB, 0);
  cv.grabCut(extractImg, mask, rect, bgdModel, fgdModel, 1, cv.GC_INIT_WITH_RECT);
  for(let i=0; i<extractImg.rows; i++){
    for(let j=0; j<extractImg.cols; j++){
      if(mask.ucharPtr(i,j)[0] === 0 || mask.ucharPtr(i,j)[0] === 2){
        extractImg.ucharPtr(i,j)[0] = 255;
        extractImg.ucharPtr(i,j)[1] = 255;
        extractImg.ucharPtr(i,j)[2] = 255;
      }
    }
  }
  cv.cvtColor(extractImg, extractImg, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(extractImg, extractImg, 120, 200, cv.THRESH_BINARY);
  cv.imshow('substResult1', extractImg); //sketch extraction result

  let dest = cv.Mat.zeros(extractImg.cols, extractImg.rows, cv.CV_8UC3);
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(extractImg, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
  for (let i = 0; i < contours.size(); ++i) {
    //random colors
    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                          Math.round(Math.random() * 255));
    cv.drawContours(dest, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
  }
  cv.imshow('substResult2', dest); //contour extraction result

  for(let j=0; j<contours.size(); j++){
    let contour = contours.get(j);
    let area = cv.contourArea(contour,false);

    //post the largest area msg
    if((area > areaThreshold) && (area < areaMaxSize)){

      // var scriptLine = "polygon(points=["; //for openscad

      var scriptLine = ''; //for openJscad
      var line = '';

      for(let k=0; k<contour.data32F.length; k+=2){
        var x = contour.data32F[k];
        var y = contour.data32F[k+1];

        if( x != undefined, y != undefined)
          line = '[' + x + ',' + y + '],\n'

  			line = line.replace(/e-4[0-9]+/g,'');
        scriptLine += line;
      } // EOF for k
      scriptLine = scriptLine.substring(0, scriptLine.length - 2); //splice last ', & new line char'
      scriptLine = 'var poly = polygon([' + scriptLine + ']);'
      //for openscad
      // scriptLine += ']);' //close script line
      // scriptLine = 'linear_extrude(height = 10, center = true, convexity = 10, twist = 0) ' + scriptLine;

      // var extrudePtrn = 'return linear_extrude({height: 5, twist: 90}, poly)'; //test twist
      let extrudePtrn = 'return linear_extrude(poly, {height: 5})';
      let scaleScript = '.scale([' + scaleFactorToBedSize + ','+ scaleFactorToBedSize + ',2])'
      scriptLine = 'function main(){ ' + scriptLine + extrudePtrn + scaleScript + ';}'

      var msg = {
        msg: "writeFile",
        script: scriptLine
      };

      channel.postMessage(msg);
    }
  } // EOF for j
}
