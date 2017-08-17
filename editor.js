// import Dropzone from 'react-dropzone'

var container, stats;
var camera, controls, scene, renderer;
var objects = [];

var stlModel;

//1:jumper, 2:swing,
//3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
//9:dfriction

var gearType = 9
var gear;
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
console.log("stlModel: ", stlModel)

  // add gears

  //1:jumper, 2:swing,
  //3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
  //9:dfriction
  switch(gearType){

    case 1: //jumper
    case 2: //swing
      gear = new Gears(2);

      gear.box.add(gear.left); //to group move by drag
      gear.box.add(gear.right);

      // CSG operation
    break;

    case 3: //cam
    case 4: //jumper_gear
    case 5: //friction
    case 6: //crank
    case 7: //pulley
    case 8: //slider
      gear = new Gears(3);

      topUplimit = gear.top.position.y;
      console.log("topUplimit: ", topUplimit);

      gear.box.add(gear.top); //to group move by drag
      gear.box.add(gear.left);
      gear.box.add(gear.right);
    break;

    case 9: //double_friction
      gear = new Gears(5);

      gear.box.add(gear.top); //to group move by drag
      gear.box.add(gear.left);
      gear.box.add(gear.right);
      gear.box.add(gear.front);
      gear.box.add(gear.back);
    break;

    default:
  }

  scene.add(gear.box);
  objects.push(gear.box);


  //geometry operation
  var materialNormal = new THREE.MeshNormalMaterial();

  var geomGear = THREE.CSG.toCSG(gear.box);
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

//
function animate() {
  requestAnimationFrame( animate );

  //1:jumper, 2:swing,
  //3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
  //9:dfriction
  switch(gearType){
    case 1: //jumper
      gear.left.rotation.x += 0.01;
      gear.right.rotation.x += 0.01;
    break;

    case 2: //swing
      //gear.left.position.x += 0.01; //should be left/right
      gear.right.position.x += 0.01;
    break;

    case 3: //cam
      // cam.top.position.y += 0.01; //should be half rotation
      gear.left.rotation.x += 0.01;
      gear.right.rotation.x += 0.01;
    break;

    case 4: //jumper gear
      gear.top.position.y += 0.01; //should be up down
      gear.left.rotation.x += 0.01;
      gear.right.rotation.x += 0.01;
    break;

    case 5: //friction gear
      gear.top.position.y += 0.01;
      gear.left.rotation.x += 0.01;
      gear.right.rotation.x -= 0.01;
    break;

    case 6: //crank
      // gear.top.position.y += 0.01; //should be updown
      gear.left.rotation.x += 0.01;
      gear.right.rotation.x -= 0.01;
    break;

    case 7: //crank
      // gear.top.position.y += 0.01; //should be updown
      gear.left.rotation.x += 0.01;
      gear.right.rotation.x -= 0.01;
    break;

    case 8: //pulley
      gear.top.position.x += 0.01; //should change the direction
      gear.left.position.x += 0.01;
      gear.right.position.x += 0.01;
    break;

    case 9: //slider
      gear.top.rotation.y += 0.01; //should change the direction
      gear.left.rotation.x += 0.01;
      gear.right.rotation.x -= 0.01;
      gear.front.rotation.z += 0.01;
      gear.back.rotation.z -= 0.01;
    break;

    default:
  }
  stlModel.rotation.set( settings_model['x'] * (Math.PI / 180),
                         settings_model['y'] * (Math.PI / 180),
                         settings_model['z'] * (Math.PI / 180));

  render();
  stats.update();
}

function render() {

  controls.update();
  renderer.render( scene, camera );
}
