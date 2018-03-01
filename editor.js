// Main editor for user interaction on the screen & preview

var container, stats;
var camera, controls, scene, renderer;
var originObj, originPoint;
var objects = []; //3D objects to add on the scene

init();
animate();

var loader = new THREE.STLLoader();

var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff});
var slicingGeometry = new THREE.Geometry();

//this is for debug purpose; draw 2d contourline from cam img process, load to preview
var contourLineGeometry = new THREE.Geometry();
var curveFromCam = [];

function init() {

  createPanel(); //load basic UI

  container = document.createElement( 'div' );
  document.body.appendChild( container );
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1100 );
  camera.position.z = 500;

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

  //base grid
  var grid = new THREE.GridHelper( 1000, 100, 0x888888, 0xcccccc );
  grid.position.set(0, -100, 0);
  scene.add( grid );

  //axis GridHelper
  // var axesHelper = new THREE.AxesHelper( 5 );
  // scene.add( axesHelper );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0xf0f0f0 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.sortObjects = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild( renderer.domElement );

  controls = new THREE.TrackballControls( camera, renderer.domElement );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;


  //mouse events
  controls.addEventListener( 'change', function() {
  } );

  window.addEventListener( 'mousedown', function () {
  }, false );

  window.addEventListener( 'mouseup', function() {
  });

  window.addEventListener( 'resize', onWindowResize, false );

  window.addEventListener('click', function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement
        // ,text = target.textContent || text.innerText;
    clickedBtnID = window.event.target.id
  }, false);


  //geometry operation
  var materialNormal = new THREE.MeshNormalMaterial();

  var dragControls = new THREE.DragControls( objects, camera, renderer.domElement );
  dragControls.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
  dragControls.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );

  stats = new Stats();
  container.appendChild( stats.dom );

} //end of init

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}


function animate() {
  requestAnimationFrame( animate );

  render();
}

function render() {

  update();
  stats.update();
  controls.update();
  renderer.render( scene, camera );
}


function update() {

}

// function drawLine() {
//   var line = new THREE.Line(slicingGeometry, lineMaterial);
//   scene.add(line);
//   render(camera);
// }
