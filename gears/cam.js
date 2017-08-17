function Gears(numBbox) {

	var mesh = [];

	// var material = new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff, transparent: true } );
	var material1 = new THREE.MeshStandardMaterial( {
		color: Math.random() * 0xffffff,
		opacity: 50,
		premultipliedAlpha: true,
		transparent: true
	} );

	var material2 = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true
	});

	var boxGeometry = new THREE.CubeGeometry( 50, 50, 50 );
	var box = new THREE.Mesh( boxGeometry, material1 );

	//depending on the type of bbox, the shape could be different
	var leftBbox = new THREE.Mesh( boxGeometry, material2 );
	leftBbox.position.set( -60, 0, 0);

	var rightBbox = new THREE.Mesh( boxGeometry, material2 );
	rightBbox.position.set( 60, 0, 0);

	// # of bbox === 2
	if( numBbox === 2 ){

		mesh = {
			box: box,
			left: leftBbox,
			right: rightBbox
		}
	}

	// # of bbox === 3
	if( numBbox === 3 ){

		var top = new THREE.Mesh( boxGeometry, material2 );
		top.position.set(0, 60, 0);

		mesh = {
			box: box,
			top: top, //to give different rotation direction
			left: leftBbox,
			right: rightBbox
		}
	}

	// # of bbox === 5
	if( numBbox === 5 ){
		var top = new THREE.Mesh( boxGeometry, material2 );
		top.position.set(0, 60, 0);

		var frontBbox = new THREE.Mesh( boxGeometry, material2 );
		frontBbox.position.set( 0, 0, -60);

		var backBbox = new THREE.Mesh( boxGeometry, material2 );
		backBbox.position.set( 0, 0, 60);

		mesh = {
			box: box,
			top: top, //to give different rotation direction
			left: leftBbox,
			right: rightBbox,
			front: frontBbox,
			back: backBbox
		}

	}
	return mesh;
}
