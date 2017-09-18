// import Dropzone from 'react-dropzone'

var container, stats;
var camera, controls, scene, renderer;
var objects = [];
var originObj, originPoint;

var stlModel;
var selectedGear;

var latestGearRotation = 1, rotationChanged = 0, rotationChangedId; //positive

//variables for rotation direction simulator
var newPower, curPower = 'rotary', conflict = false; //should be returned by the first gear
var collisionOccured = false, collidableMeshList = [];
var directionList = [];


var body, arm1, arm2, head;

var gears = [], gearsElement, gearIdx = 0;
//to animate gear mechanisms
var swingDelta = 0.01, camDelta = 0.01,
    crankDelta = 0.15, pulleyDelta = 0.25, sliderDelta = 0.25;

init();
animate();

var loader = new THREE.STLLoader();

function init() {

  // get type of gear and create UI according to it
  createPanel(); //load basic UI

  container = document.createElement( 'div' );
  document.body.appendChild( container );
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
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


  var grid = new THREE.GridHelper( 1000, 100, 0x888888, 0xcccccc );
  grid.position.set(0, -100, 0);
  scene.add( grid );


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


  var changed = false;

  controls.addEventListener( 'change', function() {
    // moved = true;
  } );

  window.addEventListener( 'mousedown', function () {
    changed = false;

  }, false );

  window.addEventListener( 'mouseup', function() {

  });

  if (curPower != newPower)
    conflict = true; //function to prompt conflict

  //geometry operation
  var materialNormal = new THREE.MeshNormalMaterial();


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

  showDiv();
}

function loadGearBox(gearType) {
  // add gears
  console.log("curr gearType: ", gearType);
  var material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );

  if(gearType < 3 ){ // 1 or 2

    gearsElement = new Gears(2, gearType);

    gearsElement.box.add(gearsElement.left); //to group move by drag
    gearsElement.box.add(gearsElement.right);

    gearsElement.powerType = (gearType === 1 ) ? 'rotary' : 'halfrotary';

    if(gears[0]){
      gearsElement.left.rotation.x = gears[gearIdx-1].right.rotation.x;
      gearsElement.right.rotation.x = gears[gearIdx-1].right.rotation.x;
    }
    addLRScalePanel();

  }
  else if((gearType > 2 ) || (gearType < 9)){

    gearsElement = new Gears(3, gearType);

    gearsElement.box.add(gearsElement.top); //to group move by drag
    gearsElement.box.add(gearsElement.left);
    gearsElement.box.add(gearsElement.right);
    gearsElement.box.add(gearsElement.lshaft);
    gearsElement.box.add(gearsElement.rshaft);
    gearsElement.box.add(gearsElement.tshaft);

    gearsElement.powerType = (gearType === (7 || 8)) ? 'linear' : 'rotary';

    if(gears[0]){
      gearsElement.left.rotation.x = gears[gearIdx-1].right.rotation.x;
      gearsElement.right.rotation.x = gears[gearIdx-1].right.rotation.x;
    }

    addLRScalePanel();
    addTopScalePanel(); //add top bounding box UI
  }

  //add gear dependent mechanism
  switch(gearType){//gearType){

    case 1: //jumper
    case 2: //swing
      //if(UI for top part is created)
      //  removePanel()
    break;

    case 3: //bevel
      loader.load( './assets/bevel.stl', ( geometry ) => {

        var lgear = new THREE.Mesh( geometry, material );
        lgear.rotateY(Math.PI/2);
        lgear.position.set(-15,0,0);
        gearsElement.leftGear = lgear;
        gearsElement.box.add(gearsElement.leftGear); // to drag as a group

        var tgear = lgear.clone();
        tgear.rotateX(Math.PI/2);
        tgear.position.set(0,15,0);
        gearsElement.topGear = tgear;
        gearsElement.box.add(gearsElement.topGear);
      });
    break;

    case 4: //cam
      var diskGeometry = new THREE.CylinderGeometry( 10, 10, 7, 50 );
      var disk = new THREE.Mesh( diskGeometry, material);

      disk.rotateZ(Math.PI/2);
      disk.scale.set(1, 1, 1.6);
      // disk.position.set(0,100,0);
      gearsElement.cam = disk;
      gearsElement.box.add(gearsElement.cam);
    break;

    case 5: //dcam
      var diskGeometry = new THREE.CylinderGeometry( 10, 10, 7, 50 );
      var disk1 = new THREE.Mesh( diskGeometry, material);
      disk2 = disk1.clone();

      disk1.rotateZ(Math.PI/2);
      disk1.scale.set(1, 1, 1.3);
      disk1.position.set(-10, 10, 0);

      disk2.rotateZ(Math.PI/2);
      disk2.scale.set(1, 1, 1.3);
      disk2.position.set(10, -10, 0);

      gearsElement.cam1 = disk1;
      gearsElement.cam2 = disk2;

      gearsElement.box.add(gearsElement.cam1);
      gearsElement.box.add(gearsElement.cam2);
    break;

    case 6: //crank
      loader.load( './assets/bevel.stl', ( geometry ) => {

        var lgear = new THREE.Mesh( geometry, material );
        lgear.rotateY(Math.PI/2);
        lgear.position.set(-15, 0, 0);
        gearsElement.leftGear = lgear;
        gearsElement.box.add(gearsElement.leftGear); // to drag as a group

        var rgear = lgear.clone();
        rgear.rotateY(Math.PI);
        rgear.position.set(15, 0, 0);
        gearsElement.rightGear = rgear;
        gearsElement.box.add(gearsElement.rightGear);

        var tgear = lgear.clone();
        tgear.rotateX(Math.PI/2);
        tgear.position.set(0,15,0);
        gearsElement.topGear = tgear;
        gearsElement.box.add(gearsElement.topGear);
      });

      latestGearRotation = -1; //negative
      rotationChangedId = gearIdx;
    break;

    case 7: //pulley
    case 8: //slider
    break;

    case 9: //double_friction
      gearsElement = new Gears(5);
    break;

    default:
      console.log("in switch case")
  } //end of switch

  gearsElement.gearType = gearType;
  gearsElement.box.position.x += 160 * gearIdx;
  gears[gearIdx] = gearsElement;
  gearIdx++;

  scene.add(gearsElement.box);
  objects.push(gearsElement.box);

}

// tentative function to load animation
function loadAndroid(){
  var material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );

  loader.load('./assets/android-body.stl', (geometry) => {
    body = new THREE.Mesh(geometry, material);
    body.rotation.set( - Math.PI / 2, 0, 0 );
    body.scale.set(6.8, 6.8, 6.8);
    body.position.set(0,-65,0);
    scene.add(body)
  });

  loader.load('./assets/arm.stl', (geometry) => {
    arm1 = new THREE.Mesh(geometry, material);
    arm2 = new THREE.Mesh(geometry, material);

    arm1.rotation.set( - Math.PI / 2, 0, 0 );
    arm1.scale.set(6.8, 6.8, 6.8);
    arm1.position.set(-40,0,0);

    arm2.rotation.set( - Math.PI / 2, 0, 0 );
    arm2.scale.set(6.8, 6.8, 6.8);
    arm2.position.set(40,0,0);
    scene.add(arm1)
    scene.add(arm2)
  });

  loader.load('./assets/head.stl', (geometry) => {
    head = new THREE.Mesh(geometry, material);

    head.rotation.set( - Math.PI / 2, 0, 0 );
    head.scale.set(6.8, 6.8, 6.8);
    head.position.set(0,35,0);
    scene.add(head)
  });
}

function animate() {
  requestAnimationFrame( animate );

  gears.forEach((gear, i) =>{
    switch(gear.gearType){// gearType){
      case 1: //jumper
        var rotationDirection = 0.01;

        if((latestGearRotation === -1) && (i > rotationChangedId))
          rotationDirection *= -1;

        gear.left.rotation.x += rotationDirection;
        gear.right.rotation.x += rotationDirection;
      break;

      case 2: //swing
        var rotAngle = gear.left.rotation.x;
        if((rotAngle < 0) || (rotAngle > 180 * Math.PI/180)){
          swingDelta *= -1;
        }
        if((latestGearRotation === -1) && (i > rotationChangedId))
          swingDelta *= -1;

        gear.left.rotation.x += swingDelta;
        gear.right.rotation.x += swingDelta;
      break;

      case 3: //bevel gear
        var rotationDirection = 0.01;

        if((latestGearRotation === -1) && (i > rotationChangedId))
          rotationDirection *= -1;

        gear.top.rotation.y += rotationDirection;
        gear.topGear.rotation.z -= rotationDirection;
        gear.left.rotation.x += rotationDirection;
        gear.leftGear.rotation.x += rotationDirection;
        gear.right.rotation.x += rotationDirection;

        if(body){
          console.log("body is loaded")

          head.rotation.z += rotationDirection;
          arm1.rotation.x += rotationDirection;
          arm2.rotation.x += rotationDirection;
        }

      break;

      case 4: //crank
        var topPos = gear.top.position.y;
        if((topPos > gear.box.position.y + 75) || (topPos < gear.box.position.y + 50)) //original pos+=50, w/2=25
          crankDelta *= -1;

        var rotationDirection = 0.01;
        if((latestGearRotation === -1) && (i > rotationChangedId))
          rotationDirection *= -1;

        gear.top.position.y += crankDelta; //should be updown
        gear.tshaft.position.y += crankDelta;
        gear.left.rotation.x += rotationDirection;
        gear.right.rotation.x += rotationDirection;
        gear.cam.rotation.x += rotationDirection;
      break;

      case 5: //dcam
        var rotAngle = gear.top.rotation.y;
        if((rotAngle < 0) || (rotAngle > Math.PI)){
          camDelta *= -1;
        }

        var rotationDirection = 0.01;
        if((latestGearRotation === -1) && (i > rotationChangedId))
          rotationDirection *= -1;

        gear.top.rotation.y += camDelta; //should be half rotation
        gear.left.rotation.x += rotationDirection;
        gear.right.rotation.x += rotationDirection;
        gear.cam1.rotation.x += rotationDirection;
        gear.cam2.rotation.x += rotationDirection;
      break;

      case 6: //friction gear
        var rotationDirection = 0.01;
        if((latestGearRotation === -1) && (i > rotationChangedId))
          rotationDirection *= -1;

        gear.top.rotation.y += rotationDirection;
        gear.topGear.rotation.z -= rotationDirection;
        gear.left.rotation.x += rotationDirection;
        gear.leftGear.rotation.x += rotationDirection;
        gear.right.rotation.x -= rotationDirection;
        gear.rightGear.rotation.x -= rotationDirection;
      break;

      case 7: //pulley
        var leverPos = gear.top.position.x + (160 * i); //base position
        if((leverPos < gear.box.position.x - 10) || (leverPos > gear.box.position.x + 10)) //original pos+=50, w/2=25
          pulleyDelta *= -1;
      break;

      case 8: //slider
        var leverPos = gear.left.position.x;
        if((leverPos <= gear.box.position.x - 75) || (leverPos >= gear.box.position.x - 25)) //original pos+=50, w/2=25
        sliderDelta *= -1;

        gear.top.position.x += 0.01; //should change the direction
        gear.left.position.x += sliderDelta;
        gear.right.position.x += sliderDelta;
      break;

      case 9: //double_friction
        gear.top.position.x += pulleyDelta;
        gear.left.position.x += pulleyDelta;
        gear.right.position.x += pulleyDelta;
        gear.lshaft.position.x += pulleyDelta;
        gear.rshaft.position.x += pulleyDelta;
        gear.tshaft.position.x += pulleyDelta;
      break;

      default:
    } //EO Switch

  });

  render();
  stats.update();
}

function render() {

  update();
  controls.update();
  renderer.render( scene, camera );
}


function update() {


  ///////************ this is for CSG operations
  if(meshToReturn != undefined){
  //   console.log("meshToReturn loaded: ", meshToReturn)
  //
  //   var cube = CSG.cube();
  //   var geometryThree  = THREE.CSG.fromCSG(cube);
  //   scene.add(geometryThree);
  //
  //   // var geomModel = THREE.CSG.toCSG(meshToReturn);
  //   // console.log("geom Model: ", geomModel);
  //

  // console.log(gears[0].topGear);
  }


  if(gears[1] != undefined){ //at least two boxes for collision detection
    var originObj = gears[0].box;
    var originPoint = originObj.position.clone();

    // console.log(originPoint)
    var emptyMeshList = [];
    var powerList = [];

    for(var i=1; i<gearIdx; i++){
      powerList.push(gears[i].powerType);

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
            if((power != originObj.powerType) && changed) {//&& (collisionOccured === false)){
  			     window.alert("Gearboxes are not compatible in power direction");
             changed = false;
           }
        })
      }
  	}

  }
}
