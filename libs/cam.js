var capturedImgOjects = [];
var pausedPrint = false;

var capturedforExtraction = false;
var extrusionCnt = 1; //intervention count

//common vars for CV
var mask = new cv.Mat();
var dst = new cv.Mat(); //subtraction destination
var dtype = -1;

var rect = new cv.Rect(50,20,200,180); //set to printing base size shown in the cam
const areaLowerBound = 30;
const areaUpperBound = 10000;

var extHeight = 10;
var scaleFactorToBedSize = 13.6;

// vars to clear images
var areaToRemove = new cv.Mat();
var insertObjTranslateValue = {};


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


// step1. detect foreground of 1st & 2nd img
// step2. disply 1st's foreground (being printed object as insertion background)
// step3. disply inserted object's contour line by subtracting 2nd from 1st
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

    //draw foreground for "Before" insertion
    for(let i=0; i<imgFirst.rows; i++){
      for(let j=0; j<imgFirst.cols; j++){
        if(mask.ucharPtr(i,j)[0] === 0 || mask.ucharPtr(i,j)[0] === 2){
          imgFirst.ucharPtr(i,j)[0] = 255;
          imgFirst.ucharPtr(i,j)[1] = 255;
          imgFirst.ucharPtr(i,j)[2] = 255;
        }
      }
    }

    //draw foreground for "After" insertion
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
    cv.imshow('substResult1', imgFirst); // a 3D object currently being printed

    //thresholding of the foreground detected imgs to find difference
    cv.cvtColor(imgFirst, imgFirst, cv.COLOR_RGBA2GRAY, 0);
    cv.cvtColor(imgSecnd, imgSecnd, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(imgFirst, imgFirst, 100, 200, cv.THRESH_BINARY);
    cv.threshold(imgSecnd, imgSecnd, 100, 200, cv.THRESH_BINARY);


    // find contour for extracted forground objects
    let dstForegroundOrigin = cv.Mat.zeros(dst.cols, dst.rows, cv.CV_8UC3)
      , dstForegroundInsert = cv.Mat.zeros(dst.cols, dst.rows, cv.CV_8UC3);
    let contoursOrigin = new cv.MatVector()
      , contoursInsert = new cv.MatVector();
    let hierarchy = new cv.Mat();


    // find contour of the original model being printed
    cv.findContours(imgFirst, contoursOrigin, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contoursOrigin.size(); ++i) {
      //random colors
      let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
      Math.round(Math.random() * 255));
      cv.drawContours(dstForegroundOrigin, contoursOrigin, i, color, 1, cv.LINE_8, hierarchy, 100);
    }
    let cntOriginObject = contoursOrigin.get(0);
    let mOrigin = cv.moments(cntOriginObject, false);
    let cxOrigin = mOrigin.m10/mOrigin.m00;
    let cyOrigin = mOrigin.m01/mOrigin.m00; //contourline center


    // find contour of inserted object by background subtraction
    cv.subtract(imgSecnd, imgFirst, dst, mask, dtype); // dst = img after insertion(2nd) - before insertion(1st)
    cv.findContours(dst, contoursInsert, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contoursInsert.size(); ++i) {
      //random colors
      let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
      Math.round(Math.random() * 255));
      cv.drawContours(dstForegroundInsert, contoursInsert, i, color, 1, cv.LINE_8, hierarchy, 100);
    }
    let cntInsertObject = contoursInsert.get(0);
    let mInsert = cv.moments(cntInsertObject, false);
    let cxInsert = mInsert.m10/mInsert.m00;
    let cyInsert = mInsert.m01/mInsert.m00; //contourline center

    console.log("Center pts of the original object: ", cxOrigin, cyOrigin);
    console.log("Center pts of the inserted object: ", cxInsert, cyInsert);
    cv.imshow('substResult1', dstForegroundOrigin); // a 3D object currently being printed
    cv.imshow('substResult2', dstForegroundInsert);


    insertObjTranslateValue = {
      x: cxOrigin - cxInsert,
      y: cyOrigin - cyInsert
    }
    console.log("Translate value: ", insertObjTranslateValue);

    var scriptLine = 'function main(){'
      // var originPoly = import original stl
      // var insertPoly = import the inserted object stl
      // return difference(originPoly, insertPoly.translate([insertObjTranslateValue.x, insertObjTranslateValue.y, 0]));
    '}'
    contoursOrigin.delete();
    contoursInsert.delete();
    dstForegroundOrigin.delete();
    dstForegroundInsert.delete();
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
    else if(clickedBtnID === "holesBtn"){
      document.getElementById('holesBtn').value = "Extract Image"
    }
    else if(clickedBtnID === "dentBtn"){
      document.getElementById('dentBtn').value = "Extract Image"
    }
    else if(clickedBtnID === 'scaleBtn'){
      document.getElementById('scaleBtn').value = "Extract Image"
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
      document.getElementById('extrudeBtn').value = "Simple extrude";
    }
    else if(clickedBtnID === "holesBtn"){
      document.getElementById('holesBtn').value = "Create holes"
    }
    else if(clickedBtnID === "dentBtn"){
      document.getElementById('dentBtn').value = "Create dent"
    }
    else if(clickedBtnID === 'scaleBtn'){
      document.getElementById('scaleBtn').value = "Scaling extrude"
    }
    else if(clickedBtnID === 'revolveBtn'){
      document.getElementById('revolveBtn').value = "Revolve";
    }
    else if(clickedBtnID === 'twistBtn'){
      document.getElementById('twistBtn').value = "Twist";
    }

    ExtractSketchContextBased(); //first extrusion, don't need to remove filament color

  }
  capturedforExtraction = 1 - capturedforExtraction; //toggle

}

function ExtractSketchContextBased(){

  let extractImg = cv.imread(imgSketchExtraction);

  //scale to reduce self-intersecting pts
  // console.log("see if can get image size: ", extractImg);
  // let dsize = new cv.Size(extractImg.rows*1.5, extractImg.cols*1.5);
  // cv.resize(extractImg, extractImg, dsize, 0, 0, cv.INTER_AREA);

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

  if ((extrusionCnt > 1) || (clickedBtnID === 'holesBtn')){ //extrude excluding hole

    var largestPolyIdx = 0
    , largestPolyScript = ''
    , areaMaxSize = areaLowerBound
    , polygonHoles = [] //array of var poly = polygon([]) scripts
    , polygonHoleScripts = '' //integrated script to extrude

    for(let j=0; j<contours.size(); j++){
      let contour = contours.get(j);
      let area = cv.contourArea(contour, false);

      //post the largest area msg
      if((area > areaLowerBound)){ // && (area < areaUpperBound)){
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

    if(largestPolyIdx > -1){
      polygonHoles.splice(largestPolyIdx, 1); //remove the largest (single value) from detected contourlines array;
    }
    // polygonHoles.pop(); //remove the last element, last is always the largest area?

    polygonHoles.forEach((holes, i) =>{
      var line = [holes.slice(0,8), i, holes.slice(8)].join('');
      polygonHoleScripts += line + '; polygons.push(poly' + i + ')\n';
    });

    var height = document.getElementById('extrudeHeightInput').value;

    //***************************** this is to create holes; *****************************//
    var extrudeScript1 = '   var a = linear_extrude({height:' + height + '}, poly);\n';
    var extrudeScript2 = '   var integratedHoles = linear_extrude({height: ' + (height+1) +' }, poly0);\n'
                        + '   polygons.forEach((polys) => { \n'
                        + '      var newPoly = linear_extrude({height:6}, polys);\n'
                        + '      integratedHoles = union(integratedHoles, newPoly); \n'
                        + '   });'

    scriptLine = 'function main(){ \n'
                        +'   var polygons = [];\n'
                        + largestPolyScript + ';\n'  //largest area for linear extrusion
                        + polygonHoleScripts  //smaller areas for creating holes
                        + extrudeScript1  + extrudeScript2
                        + '\n return difference(a, integratedHoles).scale([40, 40,1]);}' //empirical scale

    // ***************************** Replace this after test succeed *****************************//
    // scriptLine = scripts.replace('polygon(', '').substring(0, scriptLine.length - 1);
    // scriptLine = 'function main(){ \n'
    //               + scriptLine //define 2D path
    //               + 'var outlines = rectangular_extrude(poly,  {w: 0.05, h: 3, closed: true});\n'
    //               + 'return outlines..scale([38.8, 38.8,1]); \n }' //rectangular_extrude along the line
    // *************************************************************************************//

    console.log(scriptLine);

  }
  else if (extrusionCnt === 1){
    console.log("clicked btn: ", clickedBtnID);

    for(let j=0; j<contours.size(); j++){
      let contour = contours.get(j);
      let area = cv.contourArea(contour, false);
      let rect = cv.boundingRect(contour);

      // console.log("see what can we learn from bounding rectangle", rect);

      //post the largest area for the most of extrusion patterns, except creating holes
      if((area > areaLowerBound)){ // && (area < areaUpperBound)){
        var scriptLine = 'var poly = polygon(['
        , extrudePtrn = ''
        , line = ''
        , contourCnt = contour.data32F.length;

        // let translateScript = '.center()'
        let translateScript = '.translate([' + -1*contour.data32F[0] + ',' + -1*contour.data32F[1] + ',0])'
        translateScript = translateScript.replace(/e-4[0-9]+/g,'');

        let rotateScript = '.rotateZ(90)' // to rotate for revolve from center, x-axis

        for(let k=0; k<contourCnt; k+=2){
          var x = contour.data32F[k];
          var y = contour.data32F[k+1];

          line = '[' + x + ',' + y + '],\n'
          line = line.replace(/e-4[0-9]+/g,'');
          scriptLine += line; //center
        } // EOF for k
        scriptLine = scriptLine.substring(0, scriptLine.length - 2) + '])';

        if(clickedBtnID === 'extrudeBtn'){
          extrudePtrn = '\n return linear_extrude({height:' + extHeight + '}, poly).scale([39, 39,1]);' // should this be centered even with the translateScript?
          scriptLine = 'function main(){ ' + scriptLine + translateScript + extrudePtrn + '}'
        }
        else if(clickedBtnID === "dentBtn"){
          let cylRadius = rect.height/2;
          let cylHeight = rect.width;
          let cylOffsetZ = cylRadius;// + extHeight;

          extrudePtrn = '\n var polyBase = linear_extrude({height:' + extHeight + '}, poly).scale([39, 39, 1]).center();\n'
          scriptLine = 'function main(){' + scriptLine + translateScript
                        + extrudePtrn
                        + 'var polyCut = cylinder({h:' + cylHeight + ', r:' + cylRadius + ', center:true}).rotateX(90).translate([0,0,' + cylOffsetZ + ']);\n'
                        + 'return difference(polyBase, polyCut); \n'
                        + ' }\n'

          console.log(scriptLine);
        }
        else if(clickedBtnID === 'scaleBtn'){
          extrudePtrn = '\n return linear_extrude({height:' + extHeight + '}, poly).scale([39, 39,1]);\n'
          scriptLine = 'function main(){ ' + scriptLine + translateScript + extrudePtrn + '}\n' //close main
        }
        else if(clickedBtnID === 'revolveBtn'){
          extrudePtrn = '\n return rotate_extrude(poly).scale(13.6);\n' // emperical scale value
          scriptLine = 'function main(){ ' + scriptLine + translateScript + rotateScript + extrudePtrn + '}\n'
        }
        else if(clickedBtnID === 'twistBtn'){
          console.log("extrude with twist")
          extrudePtrn = '\n return linear_extrude({height:' + extHeight + ', twist: 90}, poly).scale([40, 40,1]);\n' //twist >> where could twist extrusion interesting?
          scriptLine = 'function main(){ ' + scriptLine + '.center("x","y")' + extrudePtrn + '}\n'
        }
        else {
          //default;
        }
        //rotate might not useful for linear/twist extrusion; see details for later
      } // EOF area size checking
    } //EOF checking all contour lines found
    console.log("Current extrusion count: ", extrusionCnt++);
  } // EOF extrusionCnt > 1

  var msg = {
    msg: "createGcode",
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
