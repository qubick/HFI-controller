var meshToReturn;

function loadSTLModel(filename, filetype) {

  var loader = new THREE.STLLoader();

  // ASCII file
  if(filetype === 'ascii'){
    loader.load( filename, ( geometry ) => {

      var material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );
      // this.mesh = new THREE.Mesh( geometry, material );

      mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.set( - Math.PI / 2, 0, 0 );
      //
      // this.mesh.castShadow = true;
      // this.mesh.receiveShadow = true;
      meshToReturn = mesh;
    } );
  }

  if(filetype === 'chunk'){
    loadAndroid();
  }

  // Binary files
  if(filetype === 'binary'){

    var material = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, specular: 0x111111, shininess: 200 } );

    loader.load( filename, function ( geometry ) {

      mesh = new THREE.Mesh( geometry, material );

      mesh.position.set( 0, - 0.37, - 0.6 );
      mesh.rotation.set( - Math.PI / 2, 0, 0 );
      mesh.scale.set( 2, 2, 2 );

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add( mesh );

    } );

    loader.load( filename, function ( geometry ) {

      mesh = new THREE.Mesh( geometry, material );

      // mesh.position.set( 0.136, - 0.37, - 0.6 );
      // mesh.rotation.set( - Math.PI / 2, 0.3, 0 );
      // mesh.scale.set( 2, 2, 2 );

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add( mesh );

    } );
  }


  // Colored binary STL
  if(filetype === 'color_binary'){

    loader.load( filename, ( geometry ) => {

      var meshMaterial = material;
      if (geometry.hasColors) {
        meshMaterial = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: THREE.VertexColors });
      }

      var mesh = new THREE.Mesh( geometry, meshMaterial );

      mesh.position.set( 0.5, 0.2, 0 );
      mesh.rotation.set( - Math.PI / 2, Math.PI / 2, 0 );
      mesh.scale.set( 0.3, 0.3, 0.3 );

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add( mesh );
    } );
  }

  console.log("stl_loader: ", meshToReturn)
  if(meshToReturn)
    return meshToReturn;
}
