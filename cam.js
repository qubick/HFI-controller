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
const areaLowerBound = 30;
const areaUpperBound = 6000;

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

    // if(extrusionCnt === 1)
      ExtractFirstSketch(); //first extrusion, don't need to remove filament color
    // else
    //   ExtractAfterFirstSketch(); //exclude object color printed before

  }
  capturedforExtraction = 1 - capturedforExtraction; //toggle

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

  if(extrusionCnt === 1){
    for(let j=0; j<contours.size(); j++){
      let contour = contours.get(j);
      let area = cv.contourArea(contour, false);

      //post the largest area msg
      if((area > areaLowerBound) && (area < areaUpperBound)){
        var scriptLine = 'var poly = polygon(['
          , extrudePtrn = ''
          , line = ''
          , contourCnt = contour.data32F.length;

        //to center polygon
        let translateScript = '.translate([' + -1*contour.data32F[0] + ',' + -1*contour.data32F[1] + ',0])'
        translateScript = translateScript.replace(/e-4[0-9]+/g,'');
        let rotateScript = '.rotateZ(90)' // to rotate for revolve from center, x-axis

        for(let k=0; k<contourCnt; k+=2){
          var x = contour.data32F[k] //- initialPoint.x;
          var y = contour.data32F[k+1] //- initialPoint.y;

          line = '[' + x + ',' + y + '],\n'
          line = line.replace(/e-4[0-9]+/g,'');
          scriptLine += line; //center
        } // EOF for k
        scriptLine = scriptLine.substring(0, scriptLine.length - 2) + '])'; //splice last ', & new line char'

        if(clickedBtnID === 'extrudeBtn'){
          extrudePtrn = '\n return linear_extrude({height:' + extHeight + '}, poly).scale([13.6,13.6,1]);'
        }
        else if(clickedBtnID === 'revolveBtn'){
          extrudePtrn = '\n return rotate_extrude(poly).scale(13.6);' // emperical scale value
        }
        else if(clickedBtnID === 'twistBtn'){
          extrudePtrn = '\n return linear_extrude({height: 5, twist: 90}, poly).scale([13.6,13.6,2]);' //twist >> where could twist extrusion interesting?
        }
        else {
          //default;
        }
        //rotate might not useful for linear/twist extrusion; see details for later
        scriptLine = 'function main(){ ' + scriptLine + translateScript + rotateScript + extrudePtrn + '}' //close main
      } // EOF area size checking
    } //EOF checking all contour lines found
  }
  else if (extrusionCnt > 1){ //extrude excluding hole
  //****************************************************
  // openjscad sample
  // var poly1 = polygon([[0,0],[1,0],[1,1]])
  //        ,poly2 = polygon([[1,1],[2,1],[2,2]])
  //        ,poly3 = polygon([[2,2],[3,2],[3,3]])
  //        ,poly4 = polygon([[3,3],[4,3],[4,4]]);
  //
  //     poly.push(poly1, poly2, poly3, poly4);
  //     var finalShape = linear_extrude({height:1}, poly1)
  //
  //     for(var i=0; i<poly.length-1; i++){
  //         var aa = linear_extrude({height:1}, poly[i+1]);
  //         finalShape = union(finalShape, aa);
  //     }
  //
  //     return finalShape;
  //****************************************************
    var largestPolyIdx = 0
      , largestPolyScript = ''
      , areaMaxSize = areaLowerBound;
    var polygonHoles = [] //array of var poly = polygon([]) scripts
      , polygonHoleScripts = '' //integrated script to extrude

    for(let j=0; j<contours.size(); j++){
      let contour = contours.get(j);
      let area = cv.contourArea(contour, false);

      //post the largest area msg
      if((area > areaLowerBound) && (area < areaUpperBound)){
        var scriptLine = 'var poly = polygon(['
          , contourCnt = contour.data32F.length;

        //to center polygon
        let translateScript = '.translate([' + -1*contour.data32F[0] + ',' + -1*contour.data32F[1] + ',0])'
        translateScript = translateScript.replace(/e-4[0-9]+/g,'');

        for(let k=0; k<contourCnt; k+=2){
          var x = contour.data32F[k] //- initialPoint.x;
          var y = contour.data32F[k+1] //- initialPoint.y;

          var line = '[' + x + ',' + y + '],\n' //have to renew everytime
          line = line.replace(/e-4[0-9]+/g,'');
          scriptLine += line; //center
        } // EOF for k
        scriptLine = scriptLine.substring(0, scriptLine.length - 2) + '])'; //splice last ', & new line char'
        polygonHoles.push(scriptLine);

        if(area > areaMaxSize){
          largestPolyIdx = j;
          areaMaxSize = area;
          largestPolyScript = scriptLine;
        }
      } // EOF areaThreshold checking
    } // EOF for j, finished going through all contourlines detected

    // console.log("index of the largest area: ", largestPolyIdx);
    // console.log("# of polygons: ", polygonHolesScript.length);
    if(largestPolyIdx > -1){
      polygonHoles.splice(largestPolyIdx, 1); //remove the largest (single value);
    }
    var len = polygonHoles.length;
    console.log("# of polygons to create holes: ", len);

    polygonHoles.forEach((holes, i) =>{
      var line = [holes.slice(0,8), i, holes.slice(8)].join('');
      polygonHoleScripts += line + ';\n';
    });

    var extrudeScript1 = '   var a = linear_extrude({height:5}, poly);\n';
    var extrudeScript2 = '   var integratedHoles = linear_extrude({height:1}, poly0);\n'
        + '   for(var i=1; i<' + len + '; i++){\n'
        + '      var newPoly = linear_extrude({height:6}, poly[i]);\n'
        + '      integratedHoles = union(integratedHoles, newPoly); \n }'

    scriptLine = 'function main(){ \n'
                + largestPolyScript + ';\n'  //largest area for linear extrusion
                + polygonHoleScripts  //smaller areas for creating holes
                + extrudeScript1  + extrudeScript2
                + '\n return subtract(a, integratedHoles);}'
  } // EOF extrusionCnt > 1

  var msg = {
    msg: "writeFile",
    script: scriptLine
  };

  channel.postMessage(msg);

  fgdModel.delete();
  bgdModel.delete();
}

function getExtrudeHeight(){
  extHeight = document.getElementById('extrudeHeightInput').value;
  console.log("extrusion height: ", extHeight)
}
