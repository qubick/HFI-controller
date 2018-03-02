var capturedImgOjects = [];
var pausedPrint = false;

var capturedforExtraction = false;

//sketch extrusion type
var capturedToExtrude = false;
var capturedToRevolve = false;
var capturedToTwist = false;

var extrusionCnt = 0;

//common vars for CV
var mask = new cv.Mat();
var dst = new cv.Mat(); //subtraction destination
var dtype = -1;

var rect = new cv.Rect(50,20,200,180); //set to printing base size shown in the cam
const areaThreshold = 100;
const areaMaxSize = 6000;

var extHeight = 10;
var scaleFactorToBedSize = 13.6;

// vars to clear images
var areaToRemove = new cv.Mat();

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


// detect foreground of 1st & 2nd img
// disply 1st's foreground (being printed object as insertion background)
// disply inserted object's contour line by subtracting 2nd from 1st
function foregroundDetection(){

  console.log("foreground detection...")

    if(document.getElementById('firstImg') && document.getElementById('secondImg')){
      let imgFirst = cv.imread(firstImg);
      let imgSecnd = cv.imread(secondImg);

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

      // show currently printing layer area
      cv.imshow('substResult1', imgFirst);

      //thresholding of the foreground detected imgs to find difference
      cv.cvtColor(imgFirst, imgFirst, cv.COLOR_RGBA2GRAY, 0);
      cv.cvtColor(imgSecnd, imgSecnd, cv.COLOR_RGBA2GRAY, 0);
      cv.threshold(imgFirst, imgFirst, 100, 200, cv.THRESH_BINARY);
      cv.threshold(imgSecnd, imgSecnd, 100, 200, cv.THRESH_BINARY);

      cv.subtract(imgSecnd, imgFirst, dst, mask, dtype);

      // find contour for extracted forground images
      let dstForeground = cv.Mat.zeros(dst.cols, dst.rows, cv.CV_8UC3);
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();

      cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
      for (let i = 0; i < contours.size(); ++i) {
        //random colors
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                              Math.round(Math.random() * 255));
        cv.drawContours(dstForeground, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
      }

      cv.imshow('substResult2', dstForeground);

      dstForeground.delete();
    }
} //EOF func foregroundDetection (foreground detection & thresholding)


function captureToExtractSketch(){
  getExtrudeHeight();

  let clickedBtnID = window.event.target.id;

  if(!capturedforExtraction){
    // first capture image
    Webcam.snap( (data_uri) => {

      capturedImgOjects.push(data_uri);
      document.getElementById("results1").innerHTML =
        '<img src="'+data_uri+'" id="imgSketchExtraction"/>';
    });

    // toggle button

    if(clickedBtnID === 'extrudeBtn'){
      document.getElementById('extrudeBtn').value = "Extract Image"
    }
    else if(clickedBtnID === 'revolveBtn'){
      document.getElementById('revolveBtn').value = "Extract Image"
    }
    else if(clickedBtnID === 'twistBtn'){
      document.getElementById('twistBtn').value = "Extract Image"
    }
  }
  else{

    if(clickedBtnID === 'extrudeBtn'){
      document.getElementById('extrudeBtn').value = "Capture to Extrude";
      console.log("current extrusion cycle: ", ++extrusionCnt);
    }
    else if(clickedBtnID === 'revolveBtn'){
      document.getElementById('revolveBtn').value = "Capture to Revolve";
    }
    else if(clickedBtnID === 'twistBtn'){
      document.getElementById('twistBtn').value = "Capture to Twist";
    }

    if(extrusionCnt === 2)
      ExtractFirstSketch(); //first extrusion, don't need to remove filament color
    else
      ExtractAfterFirstSketch(); //exclude object color printed before

  }
  capturedforExtraction = 1 - capturedforExtraction; //toggle

}

function removeColor(imgReference, color){
  let red = [], green = [], blue = [65,120,225,225]
    , lime = [173, 255, 47, 255];

  color = lime;

  let src = cv.imread(imgSketchExtraction); //this is creating a cv.Mat()
  // let areaToRemove = new cv.Mat();

  // lime as example color RGB = [173, 255, 47]
  let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
  let high = new cv.Mat(src.rows, src.cols, src.type(), color);
  cv.inRange(src, low, high, areaToRemove);


  // cv.subtract(src, areaToRemove, dst, mask, dtype);
  cv.imshow('substResult1', areaToRemove);

  console.log("removed background color", substResult1);

  //clear stack
  src.delete();
  // areaToRemove.delete();
  low.delete();
  high.delete();

  // return areaToRemove;
}

function ExtractFirstSketch(){

  let extractImg = cv.imread(imgSketchExtraction);

  //params to operate subtract
  let bgdModel = new cv.Mat();
  let fgdModel = new cv.Mat();

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
  cv.imshow('substResult1', extractImg);

  let dest = cv.Mat.zeros(extractImg.cols, extractImg.rows, cv.CV_8UC3);
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let poly = new cv.MatVector();

  cv.findContours(extractImg, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

  for (let u = 0; u < contours.size(); ++u) {
    let tmp = new cv.Mat();
    let cnt = contours.get(u);
    cv.approxPolyDP(cnt, tmp, 0, true);
    poly.push_back(tmp);

    cnt.delete(); tmp.delete();
  }

  for (let i = 0; i < contours.size(); ++i) {

    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                          Math.round(Math.random() * 255));
    // cv.drawContours(dest, contours, i, color, 1, cv.LINE_8, hierarchy, 100); //normal contour
    cv.drawContours(dest, poly, i, color, 1, 8, hierarchy, 0); //polyline contour
  }
  cv.imshow('substResult2', dest); //contour extraction result

  for(let j=0; j<contours.size(); j++){
    let contour = contours.get(j);
    let area = cv.contourArea(contour, false);

    //post the largest area msg
    if((area > areaThreshold) && (area < areaMaxSize)){

      //for openJscad
      var scriptLine = 'var poly = polygon(['
        , extrudePtrn = ''
        , line = ''
        , contourCnt = contour.data32F.length;

      //to center polygon
      let translateScript = '.translate([' + -1*contour.data32F[0] + ',' + -1*contour.data32F[1] + ',0])'
      translateScript = translateScript.replace(/e-4[0-9]+/g,'');

      // to rotate for revolve
      let rotateScript = '.rotateZ(90)'

      //do not translate vertices manually
      for(let k=0; k<contourCnt; k+=2){
        var x = contour.data32F[k] //- initialPoint.x;
        var y = contour.data32F[k+1] //- initialPoint.y;

          line = '[' + x + ',' + y + '],\n'

          //for debug purpose -- check if curve is self intersecting
        //   var polyPos = {
        //     x: parseFloat(x),
        //     y: parseFloat(y)
        //   }
        //   curveFromCam.push(polyPos);
        // }

    			line = line.replace(/e-4[0-9]+/g,'');
          scriptLine += line; //center

      } // EOF for k
      scriptLine = scriptLine.substring(0, scriptLine.length - 2) + '])'; //splice last ', & new line char'

      if(clickedBtnID === 'extrudeBtn')
        extrudePtrn = '\n return linear_extrude({height:' + extHeight + '}, poly).scale([13.6,13.6,1]);'
      else if(clickedBtnID === 'revolveBtn')
        extrudePtrn = '\n return rotate_extrude(poly).scale(13.6);' // emperical scale value
      else if(clickedBtnID === 'twistBtn')
        extrudePtrn = '\n return linear_extrude({height: 5, twist: 90}, poly).scale([13.6,13.6,2]);' //twist >> where could twist extrusion interesting?

      //rotate might not useful for linear/twist extrusion; see details for later
      scriptLine = 'function main(){ ' + scriptLine + translateScript + rotateScript + extrudePtrn + '}' //close main

      var msg = {
        msg: "writeFile",
        script: scriptLine
      };

      channel.postMessage(msg);
    }
  } // EOF for j
}

function ExtractAfterFirstSketch(){

  let src = cv.imread(imgSketchExtraction); //this is creating a cv.Mat()

  // lime as example color RGB = [173, 255, 47]

  //step 1. remove bgcolor of being printed object; leave only outlines
  //this should be done only for the sketches after 1st prints
  let color = [173, 255, 47, 255]; //lime for test. Should be color picked from img?
  let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
  let high = new cv.Mat(src.rows, src.cols, src.type(), color);
  cv.inRange(src, low, high, areaToRemove);
  cv.imshow('substResult1', areaToRemove);

  let extractImg = src.clone();

  //params to operate subtract
  let bgdModel = new cv.Mat();
  let fgdModel = new cv.Mat();

  cv.cvtColor(extractImg, extractImg, cv.COLOR_RGBA2RGB, 0);
  removeColor(imgSketchExtraction, [65,120,225,225]); //try to rmv bgcolor

  //step 2. foreground detection
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

  let dest = cv.Mat.zeros(extractImg.cols, extractImg.rows, cv.CV_8UC3);
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let poly = new cv.MatVector();

  cv.findContours(extractImg, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

  for (let u = 0; u < contours.size(); ++u) {
    let tmp = new cv.Mat();
    let cnt = contours.get(u);
    cv.approxPolyDP(cnt, tmp, 0, true);
    poly.push_back(tmp);

    cnt.delete(); tmp.delete();
  }

  for (let i = 0; i < contours.size(); ++i) {

    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                          Math.round(Math.random() * 255));
    // cv.drawContours(dest, contours, i, color, 1, cv.LINE_8, hierarchy, 100); //normal contour
    cv.drawContours(dest, poly, i, color, 1, 8, hierarchy, 0); //polyline contour
  }
  cv.imshow('substResult2', dest); //contour extraction result

  for(let j=0; j<contours.size(); j++){
    let contour = contours.get(j);
    let area = cv.contourArea(contour, false);

    //post the largest area msg
    if((area > areaThreshold) && (area < areaMaxSize)){

      //for openscad
      // var scriptLine = "polygon(points=[";

      //for openJscad
      var scriptLine = 'var poly = polygon(['
        , extrudePtrn = ''
        , line = ''
        , contourCnt = contour.data32F.length;

      //to center polygon
      let translateScript = '.translate([' + -1*contour.data32F[0] + ',' + -1*contour.data32F[1] + ',0])'
      translateScript = translateScript.replace(/e-4[0-9]+/g,'');

      // to rotate for revolve
      let rotateScript = '.rotateZ(90)'

      //do not translate vertices manually
      for(let k=0; k<contourCnt; k+=2){
        var x = contour.data32F[k] //- initialPoint.x;
        var y = contour.data32F[k+1] //- initialPoint.y;

          line = '[' + x + ',' + y + '],\n'

          //for debug purpose -- check if curve is self intersecting
        //   var polyPos = {
        //     x: parseFloat(x),
        //     y: parseFloat(y)
        //   }
        //   curveFromCam.push(polyPos);
        // }

    			line = line.replace(/e-4[0-9]+/g,'');
          scriptLine += line; //center

      } // EOF for k
      scriptLine = scriptLine.substring(0, scriptLine.length - 2) + '])'; //splice last ', & new line char'

      //for openscad
      // scriptLine += ']);' //close script line
      // scriptLine = 'linear_extrude(height = 10, center = true, convexity = 10, twist = 0) ' + scriptLine;


      if(clickedBtnID === 'extrudeBtn')
        extrudePtrn = '\n return linear_extrude({height:' + extHeight + '}, poly).scale([13.6,13.6,1]);'
      else if(clickedBtnID === 'revolveBtn')
        extrudePtrn = '\n return rotate_extrude(poly).scale(13.6);' // emperical scale value
      else if(clickedBtnID === 'twistBtn')
        extrudePtrn = '\n return linear_extrude({height: 5, twist: 90}, poly).scale([13.6,13.6,2]);' //twist >> where could twist extrusion interesting?


      //rotate might not useful for linear/twist extrusion; see details for later
      scriptLine = 'function main(){ ' + scriptLine + translateScript + rotateScript + extrudePtrn + '}' //close main

      var msg = {
        msg: "writeFile",
        script: scriptLine
      };

      channel.postMessage(msg);
    }
  } // EOF for j
}

function getExtrudeHeight(){
  extHeight = document.getElementById('extrudeHeightInput').value;
  console.log("extrusion height: ", extHeight)
}
