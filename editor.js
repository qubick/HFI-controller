// import Dropzone from 'react-dropzone'

var container, stats;
var camera, controls, scene, renderer;
var objects = [];

//1:jumper, 2:swing,
//3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
//9:dfriction

var gearType = 2
var gear;
// var cam, crank, pusher; //etc
var topUplimit;

init();
animate();

function onDrop(acceptedFiles, rejectedFiles){

};

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
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

  var geometry = new THREE.BoxGeometry( 40, 40, 40 );
  for ( var i = 0; i < 10; i ++ ) {
  	var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
  	object.position.x = Math.random() * 1000 - 500;
  	object.position.y = Math.random() * 600 - 300;
  	object.position.z = Math.random() * 800 - 400;
  	object.rotation.x = Math.random() * 2 * Math.PI;
  	object.rotation.y = Math.random() * 2 * Math.PI;
  	object.rotation.z = Math.random() * 2 * Math.PI;
  	object.scale.x = Math.random() * 2 + 1;
  	object.scale.y = Math.random() * 2 + 1;
  	object.scale.z = Math.random() * 2 + 1;
  	object.castShadow = true;
  	object.receiveShadow = true;
  	scene.add( object );
  	objects.push( object );
  }
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0xf0f0f0 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.sortObjects = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild( renderer.domElement );

  //1:jumper, 2:swing,
  //3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
  //9:dfriction
  switch(gearType){

    case 1: //jumper
    case 2: //swing
      gear = new Gears(2);

      gear.box.add(gear.left); //to group move by drag
      gear.box.add(gear.right);

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
    break;

    default:
  }

  scene.add(gear.box);
  objects.push(gear.box);


  var dragControls = new THREE.DragControls( objects, camera, renderer.domElement );
  dragControls.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
  dragControls.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );

  stats = new Stats();
  container.appendChild( stats.dom );
  //
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
    break;

    case 10:
    break;

    default:
  }

  render();
  stats.update();
}

function render() {
  controls.update();
  renderer.render( scene, camera );
}
