function Gears(numBbox, gearType) {
	var newGeometry;
	var mesh = [];

	//STL loader
	var loader = new THREE.STLLoader();
	var material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );
	var gearSTL;

	var material1 = new THREE.MeshNormalMaterial( {
		color: 0x008080,
		opacity: 0.5,
		// premultipliedAlpha: true,
		transparent: true
	} );

	var material2 = new THREE.MeshBasicMaterial({
			color: 0x00ffff,
			wireframe: true
	});

	var boxGeometry = new THREE.CubeGeometry( 50, 50, 50 );
	var box = new THREE.Mesh( boxGeometry, material1 );

	var cylinder = new THREE.CylinderGeometry(5, 5, 25, 10);

	//depending on the type of bbox, the shape could be different
	var leftBbox = new THREE.Mesh( boxGeometry, material2 );
	var leftShaft = new THREE.Mesh( cylinder, material2 );
	leftBbox.position.set( -60, 0, 0);
	leftShaft.rotateZ(Math.PI/2);
	leftShaft.position.set(-25,0,0);

	var rightBbox = new THREE.Mesh( boxGeometry, material2 );
	var rightShaft = new THREE.Mesh( cylinder, material2 );
	rightBbox.position.set( 60, 0, 0);
	rightShaft.rotateZ(Math.PI/2);
	rightShaft.position.set( 25, 0, 0);


	console.log("in gear_units: load with numbox == ", numBbox)
	// # of bbox === 2
	if( numBbox === 2 ){

		mesh = {
			box: box,
			left: leftBbox,
			right: rightBbox,
			lshaft: leftShaft,
			rshaft: rightShaft
		}
	}

	// # of bbox === 3
	if( numBbox === 3 ){

		var top = new THREE.Mesh( boxGeometry, material2 );
		var topShaft = new THREE.Mesh ( cylinder, material2);
		top.position.set(0, 60, 0);
		topShaft.position.set( 0, 20, 0);

		mesh = {
			box: box,
			top: top, //to give different rotation direction
			left: leftBbox,
			right: rightBbox,
			lshaft: leftShaft,
			rshaft: rightShaft,
			tshaft: topShaft
		}
	}

	// # of bbox === 5
	if( numBbox === 5 ){
		var top = new THREE.Mesh( boxGeometry, material2 );
		top.position.set(0, 50, 0);

		var frontBbox = new THREE.Mesh( boxGeometry, material2 );
		frontBbox.position.set( 0, 0, -50);

		var backBbox = new THREE.Mesh( boxGeometry, material2 );
		backBbox.position.set( 0, 0, 50);

		mesh = {
			box: box,
			top: top, //to give different rotation direction
			left: leftBbox,
			right: rightBbox,
			front: frontBbox,
			back: backBbox
		}

	}

	// switch (gearType) {
	// 	case 1: //jumper
	// 		//no gear
	// 	break;
	//
	// 	case 2: //swing
	// 		//no gear
	// 	break;
	//
	// 	case 3: //bevel
	//
	// 		console.log("load bevel")
	// 		console.log("newGeometry: ", newGeometry)
	//
	//
	// 	break;
	//
	// 	case 4: //cam
	// 	break;
	//
	// 	case 5: //dcam
	// 	break;
	//
	// 	case 6: //friction
	// 	break;
	//
	// 	case 7:
	// 	case 8:
	// 	case 9:
	//
	// 	default:
	//
	// }
	return mesh;
}
