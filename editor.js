// import Dropzone from 'react-dropzone'

var container, stats;
var camera, controls, scene, renderer;
var objects = [];

var stlModel;
var newPower, curPower = 'rotary', conflict = false; //should be returned by the first gear
//1:jumper, 2:swing,
//3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
//9:dfriction

var gearType = 2
var gears = [], gearIdx = 0, numGearLimit = 2;
// var cam, crank, pusher; //etc
var topUplimit;

init();
animate();

function onDrop(acceptedFiles, rejectedFiles){

};

function init() {

  // get type of gear and create UI according to it
  createPanel();

  container = document.createElement( 'div' );
  document.body.appendChild( container );
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.z = 1000;
  controls = new THREE.TrackballControls( camera );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;


  scene = new THREE.Scene();
  scene.add( new THREE.AmbientLight( 0x505050 ) );
  var light = new THREE.SpotLight( 0xffffff, 1.5 );
  light.position.set( 0, 500, 2000 );
  light.castShadow = true;
  light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 200, 10000 ) );
  light.shadow.bias = - 0.00022;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  scene.add( light );


  //Ground
  var plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry( 100, 100 ),
    new THREE.MeshPhongMaterial( { color: 0x999999, specular: 0x101010 } )
  );
  plane.rotation.x = -Math.PI/2;
  plane.position.y = -0.5;
  scene.add( plane );

  plane.receiveShadow = true;


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0xf0f0f0 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.sortObjects = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild( renderer.domElement );


  // add models
  loadSTLModel('./models/makefairbot.stl', 'ascii');

  // load gears
  loadGearBox();

  if(gearType === 1 || 3 || 4 || 5 || 6 || 9){
    newPower = 'rotary'
  }
  else if (gearType === 2) {
    newPower = 'halfrotary'
  }
  else if (gearType === 7 || 8) {
    newPower = 'linear'
  }

  if (curPower != newPower)
    conflict = true; //function to prompt conflict

  //geometry operation
  var materialNormal = new THREE.MeshNormalMaterial();

  //***** prepare for intersection
  // var geomGear = THREE.CSG.toCSG(gears[gearIdx].box);
  // var geomModel = THREE.CSG.toCSG(stlModel);


  var dragControls = new THREE.DragControls( objects, camera, renderer.domElement );
  dragControls.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
  dragControls.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );

  stats = new Stats();
  container.appendChild( stats.dom );

  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function loadGearBox() {
  // add gears

  //1:jumper, 2:swing,
  //3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
  //9:dfriction
  switch(gearIdx+2){//gearType){

    case 1: //jumper
    case 2: //swing
      console.log("load gear with 2 bbox")
      gears[gearIdx] = new Gears(2);

      gears[gearIdx].box.add(gears[gearIdx].left); //to group move by drag
      gears[gearIdx].box.add(gears[gearIdx].right);

      // CSG operation
    break;

    case 3: //cam
    case 4: //jumper_gear
    case 5: //friction
    case 6: //crank
    case 7: //pulley
    case 8: //slider
      console.log("load gear with 3 bbox")
      gears[gearIdx] = new Gears(3);

      topUplimit = gears[gearIdx].top.position.y;
      console.log("topUplimit: ", topUplimit);

      gears[gearIdx].box.add(gears[gearIdx].top); //to group move by drag
      gears[gearIdx].box.add(gears[gearIdx].left);
      gears[gearIdx].box.add(gears[gearIdx].right);
    break;

    case 9: //double_friction
      gears[gearIdx] = new Gears(5);

      gears[gearIdx].box.add(gears[gearIdx].top); //to group move by drag
      gears[gearIdx].box.add(gears[gearIdx].left);
      gears[gearIdx].box.add(gears[gearIdx].right);
      gears[gearIdx].box.add(gears[gearIdx].front);
      gears[gearIdx].box.add(gears[gearIdx].back);
    break;

    default:
  } //end of switch

    scene.add(gears[gearIdx].box);
    objects.push(gears[gearIdx].box);

  gearIdx++;
}
//
function animate() {
  requestAnimationFrame( animate );

  //1:jumper, 2:swing,
  //3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
  //9:dfriction
  for(var i=0; i<gearIdx; i++){
    console.log("i: ", i, "gearType: ", gearType)
    console.log("num gear box created: ", gears.length)
    switch(i+2){// gearType){
      case 1: //jumper
        gears[i].left.rotation.x += 0.01;
        gears[i].right.rotation.x += 0.01;
      break;

      case 2: //swing
        //gear.left.position.x += 0.01; //should be left/right
        gears[i].right.position.x += 0.01;
      break;

      case 3: //cam
        // cam.top.position.y += 0.01; //should be half rotation
        gears[i].left.rotation.x += 0.01;
        gears[i].right.rotation.x += 0.01;
      break;

      case 4: //jumper gear
        gears[i].top.position.y += 0.01; //should be up down
        gears[i].left.rotation.x += 0.01;
        gears[i].right.rotation.x += 0.01;
      break;

      case 5: //friction gear
        gears[i].top.position.y += 0.01;
        gears[i].left.rotation.x += 0.01;
        gears[i].right.rotation.x -= 0.01;
      break;

      case 6: //crank
        // gear.top.position.y += 0.01; //should be updown
        gears[i].left.rotation.x += 0.01;
        gears[i].right.rotation.x -= 0.01;
      break;

      case 7: //crank
        // gear.top.position.y += 0.01; //should be updown
        gears[i].left.rotation.x += 0.01;
        gears[i].right.rotation.x -= 0.01;
      break;

      case 8: //pulley
        gears[i].top.position.x += 0.01; //should change the direction
        gears[i].left.position.x += 0.01;
        gears[i].right.position.x += 0.01;
      break;

      case 9: //slider
        gears[i].top.rotation.y += 0.01; //should change the direction
        gears[i].left.rotation.x += 0.01;
        gears[i].right.rotation.x -= 0.01;
        gears[i].front.rotation.z += 0.01;
        gears[i].back.rotation.z -= 0.01;
      break;

      default:
    } //EO Switch
  }
  stlModel.rotation.set( settings_model['x'] * (Math.PI / 180),
                         settings_model['y'] * (Math.PI / 180),
                         settings_model['z'] * (Math.PI / 180));

  if(gearIdx <= numGearLimit)
    loadGearBox();

  render();
  stats.update();
}

function render() {

  controls.update();
  renderer.render( scene, camera );
}
