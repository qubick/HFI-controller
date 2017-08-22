// import Dropzone from 'react-dropzone'

var container, stats;
var camera, controls, scene, renderer;
var objects = [];
var originObj, originPoint;

var stlModel;
var selectedGear;

//variables for rotation direction simulator
var newPower, curPower = 'rotary', conflict = false; //should be returned by the first gear
var collisionOccured = false, collidableMeshList = [];
var directionList = [];

//1:jumper, 2:swing,
//3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
//9:dfriction
var gears = [], gearsElement, gearIdx = 0, numGearLimit = 2;
// var cam, crank, pusher; //etc
var swingDelta = 0.01, camDelta = 0.01,
    crankDelta = 0.25, pulleyDelta = 0.25, sliderDelta = 0.25;

init();
animate();

// function onDrop(acceptedFiles, rejectedFiles){
//
// };

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
    new THREE.PlaneBufferGeometry( 1000, 1000 ),
    new THREE.MeshPhongMaterial( { color: 0x999999, specular: 0x101010 } )
  );
  plane.rotation.x = -Math.PI/2;
  plane.position.y = -50;
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
  // loadSTLModel('./models/makefairbot.stl', 'ascii');

  // load gears
  // loadGearBox();

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

function returnGearSelected(event){

  selectedGear = event.target.name;
  console.log("selected Gear: ", selectedGear);
  loadGearBox(parseInt(selectedGear));
}

function loadGearBox(gearType) {
  // add gears
  console.log("load gear box func() loaded")
  switch(gearType){//gearType){

    case 1: //jumper
      console.log("jumper is created")
    case 2: //swing
      console.log("load gear with 2 bbox")
      gearsElement = new Gears(2);

      gearsElement.box.add(gearsElement.left); //to group move by drag
      gearsElement.box.add(gearsElement.right);
    break;

    case 3: //cam
    case 4: //jumper_gear
    case 5: //friction
    case 6: //crank
    case 7: //pulley
    case 8: //slider
      console.log("load gear with 3 bbox")
      gearsElement = new Gears(3);

      gearsElement.box.add(gearsElement.top); //to group move by drag
      gearsElement.box.add(gearsElement.left);
      gearsElement.box.add(gearsElement.right);
      gearsElement.box.add(gearsElement.lshaft);
      gearsElement.box.add(gearsElement.rshaft);
      gearsElement.box.add(gearsElement.tshaft);
    break;

    case 9: //double_friction
      gearsElement = new Gears(5);

      gears[gearIdx].box.add(gears[gearIdx].top); //to group move by drag
      gears[gearIdx].box.add(gears[gearIdx].left);
      gears[gearIdx].box.add(gears[gearIdx].right);
      gears[gearIdx].box.add(gears[gearIdx].front);
      gears[gearIdx].box.add(gears[gearIdx].back);

    break;

    default:
      console.log("in switch case")
  } //end of switch

  if (selectedGear === 2)
    gearsElement.name = 'halfrotary'
  else if(selectedGear === 1 || 3 || 4 || 5 || 6 || 9)
    gearsElement.name = 'rotary'
  else if (selectedGear === 7 || 8)
    gearsElement.name = 'linear'

  gearsElement.box.position.x += 150 * gearIdx;
  scene.add(gearsElement.box);
  objects.push(gearsElement.box);


  gears[gearIdx] = gearsElement;
  // gears[gearIdx].position.x += 50 * gearIdx;
  gearIdx++;
}

function animate() {
  requestAnimationFrame( animate );

  //1:jumper, 2:swing,
  //3:cam, 4:jumper_gear, 5:friction, 6:crank, 7: pulley, 8:slider
  //9:dfriction
  gears.forEach((gear, i) =>{
    switch(i){// gearType){
      case 1: //jumper
        gear.left.rotation.x += 0.01;
        gear.right.rotation.x += 0.01;
      break;

      case 2: //swing
        var rotAngle = gear.left.rotation.x;
        if((rotAngle < 0) || (rotAngle > 180 * Math.PI/180)){
          swingDelta *= -1;
        }
        gear.left.rotation.x += swingDelta;
        gear.right.rotation.x += swingDelta;
      break;

      case 3: //cam
        var rotAngle = gear.top.rotation.y;
        if((rotAngle < 0) || (rotAngle > 180 * Math.PI/180)){
          camDelta *= -1;
        }
        gear.top.rotation.y += camDelta; //should be half rotation
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
        var topPos = gear.top.position.y;
        if((topPos > gear.box.position.y + 75) || (topPos < gear.box.position.y + 50)) //original pos+=50, w/2=25
          crankDelta *= -1;

        gear.top.position.y += crankDelta; //should be updown
        gear.tshaft.position.y += crankDelta;
        gear.left.rotation.x += 0.01;
        gear.right.rotation.x -= 0.01;
      break;

      case 7: //pulley
        var leverPos = gear.top.position.x + 150*i; //base position
        if((leverPos < gear.box.position.x - 10) || (leverPos > gear.box.position.x + 10)) //original pos+=50, w/2=25
          pulleyDelta *= -1;

        gear.top.position.x += pulleyDelta;
        gear.left.position.x += pulleyDelta;
        gear.right.position.x += pulleyDelta;
        gear.lshaft.position.x += pulleyDelta;
        gear.rshaft.position.x += pulleyDelta;
        gear.tshaft.position.x += pulleyDelta;

      break;

      case 8: //slider
        var leverPos = gear.left.position.x;
        if((leverPos <= gear.box.position.x - 75) || (leverPos >= gear.box.position.x - 25)) //original pos+=50, w/2=25
          sliderDelta *= -1;

        gear.top.position.x += 0.01; //should change the direction
        gear.left.position.x += sliderDelta;
        gear.right.position.x += sliderDelta;
      break;

      case 9: //double_friction_wheel
        gear.top.rotation.y += 0.01; //should change the direction
        gear.left.rotation.x += 0.01;
        gear.right.rotation.x -= 0.01;
        gear.front.rotation.z += 0.01;
        gear.back.rotation.z -= 0.01;
      break;

      default:
    } //EO Switch

  });

  // stlModel.rotation.set( settings_model['x'] * (Math.PI / 180),
  //                        settings_model['y'] * (Math.PI / 180),
  //                        settings_model['z'] * (Math.PI / 180));

  // if(gearIdx < numGearLimit)
  //   loadGearBox();

  render();
  stats.update();
}

function render() {

  update();
  controls.update();
  renderer.render( scene, camera );
}


function update() {

  if(gears[1] != undefined){ //at least two boxes for collision detection
    var originObj = gears[0].box;
    var originPoint = originObj.position.clone();

    // console.log(originPoint)
    var emptyMeshList = [];
    var powerList = [];

    for(var i=1; i<gearIdx; i++){
      powerList.push(gears[i].name);

      emptyMeshList.push(gears[i].left);
      emptyMeshList.push(gears[i].right);
      if(gears[i].top != undefined)
          emptyMeshList.push(gears[i].top);
    }

    //collision detection
    for (var vertexIndex = 0; vertexIndex < originObj.geometry.vertices.length; vertexIndex++){
  		var localVertex = originObj.geometry.vertices[vertexIndex].clone();
  		var globalVertex = localVertex.applyMatrix4( originObj.matrix );
  		var directionVector = globalVertex.sub( originObj.position );

  		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
  		var collisionResults = ray.intersectObjects( emptyMeshList ); //this should exclude self
  		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
        powerList.forEach((power) => {
            if(power != originObj.name) //&& (collisionOccured === false)){
  			     window.alert("Gearboxes are not compatible in power direction");
            // console.log("collision")
            //  collisionOccured = true
          //  }
        })
      }
  	}

  }
}
