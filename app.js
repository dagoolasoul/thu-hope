/*
========================
Configuration
========================
*/

var vr_mode = false; //Run app as a VR client
var static_mode = true; //Use fixed terrain generating seed and tree positions.
var current_time = 0; //Current time.
var panorama_mode = false;

//Scene and Camera
var camera, scene, renderer, controls;
var cameraPosition = new THREE.Vector3(0, 12, 24);
var cameraPositionTo = new THREE.Vector3(0, 12, 24);
var cameraEasing = .02;
var cameraMoveCallback = false;
var controlPosition = new THREE.Vector3(0, 12, 0);
var controlPositionTo = new THREE.Vector3(0, 12, 0);

//Panorama projection
var panorama_screen_width = 8192;
var panorama_screen_height = 768;
var panorama_camera_num = 6;
var panorama_camera_y = 10;

//Mouse click
var mouseRaycaster = new THREE.Raycaster();
var mousePosition = new THREE.Vector2();

//Trees
var treesEnabled = true;
var trees = []; //Holder all tree data
var currentFocusedTreeIndex = false;
var particlesPerDept = 500; //The maximum particles of each department
var loopUntilLeaveGrow = 1; //How many time a particle moves alone the path before generating a leave
var particleColorSchema = [
	new THREE.Color('rgb(255,225,90)'), //Lemon
	new THREE.Color('rgb(90,240,255)'), //Blue
	new THREE.Color('rgb(200,255,185)') //Green
];
var minParticles = 10000;
var treeLabelSenser = []; //Hold the meshes of tree label for interaction
var treeLabelClickTimeout = null;
var collegesData;

//Tags
var showTags = true;
var tags = [];
var tagUpdateInterval = 3600; //In second
var tagLastUpdate = 0;
var tagClickable = true;
var tagLastCheck = 0;

//Characters
var charactorEnabled = false;
var characterUpdateInterval = 10; //In second
var characterLastUpdate = 0;
var characters = [];
var character_id = false;
var characters_max_num = 50;

//LightSpot
var lightSpotEnabled = false;
var lightSpotNum = 1;
var lightSpots = [];
var lastFocusedLightSpotIndex = false;
var lastSpotUpdate = 0;

//Message
var messageDom = $('#message-card');
var messageFocusTimeout = null;
var revealNewMessage = false;
var revealCheckInterval = 10; //In second
var revealLastCheck = 0;
var revealMessageDisplayTime = 30; //In second

//Terrain
var terrain;
var generateTerrainPath = false;
var useCachedTerrainPath = true; //Use pre-calculated terrain path
var terrainPathTmpData = {}; //Hold the data for terrain path generating
var terrainPathData = []; //Hold pre-calculated terrain path

//Dat.GUI
var gui;
var showDatGUI = false;
var dataController = {
	updateData : function(){
		loadTagData();
	},	
	cameraFocus : 'FRONT'
};

//Webcam
var webcamEnabled = true;

//QRcode
var qrCodeEnabled = true;

//Sound 
var soundEnabled = false;
var sound_dp = [];
var sound_bg = [];
var soundIndex = 0;


/*
========================
App
========================
*/

function init() {
	
	//Setup scene, camera and conrols	
	if(vr_mode){
		scene = $('a-scene')[0].object3D;
	}else{
		scene = new THREE.Scene();
	}
	
	if(panorama_mode){
		scene.fog = new THREE.FogExp2( 0x000000, 0.01  );
	}else{
		scene.fog = new THREE.FogExp2( 0x000000, 0.02  );
	}
	
	if(!vr_mode){
		
		if(panorama_mode){

			renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.shadowMap.enabled = true;
			document.body.appendChild( renderer.domElement );

			var cameras = [];
			var hfov = 360 / panorama_camera_num; //Calculate horizontal angle according to number of cameras
			var width_per_screen = panorama_screen_width / panorama_camera_num;
			var height_per_screen = panorama_screen_height;
			var aspect_ratio = width_per_screen / height_per_screen;
			var vfov = calcVerticalFov(hfov, width_per_screen, height_per_screen);

			var viewport_width = window.innerWidth / panorama_camera_num;
			var viewport_height = window.innerHeight;

			for ( var i = 0; i < panorama_camera_num; i++ ) {

				var subcamera = new THREE.PerspectiveCamera( vfov , aspect_ratio, 0.01, 1000 );
				subcamera.viewport = new THREE.Vector4( i * viewport_width, 0, viewport_width, viewport_height );
				
				//Rotate camera by lookAt
				var angle_offset = 8; //Use angle offset to adjust tree position in viewport
				var look_angle = THREE.Math.degToRad((hfov * i) + angle_offset);
				var look_x =  Math.cos(look_angle) * 100;
				var look_y =  panorama_camera_y;
				var look_z =  Math.sin(look_angle) * 100;

				subcamera.position.set(0, panorama_camera_y, 0);
				subcamera.up.set(0, 1, 0);
				subcamera.lookAt(look_x, look_y, look_z);				
				subcamera.updateMatrixWorld();

				cameras.push( subcamera );
				
			}

			camera = new THREE.ArrayCamera( cameras );
			camera.updateMatrixWorld();

			window.addEventListener( 'resize', onWindowResize, false );

		}else{

			//Default mode
			renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.shadowMap.enabled = true;
			document.body.appendChild( renderer.domElement );
			camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
			camera.position.set( cameraPosition.x, cameraPosition.y, cameraPosition.z );

			controls = new THREE.OrbitControls( camera, renderer.domElement );		
			controls.target.set( controlPosition.x, controlPosition.y, controlPosition.z );
			controls.autoRotate = true;
			controls.autoRotateSpeed = .5;
			controls.screenSpacePanning = false;
			controls.minDistance = 0;
			controls.maxDistance = 200;
			controls.maxPolarAngle = Math.PI/2; 
		
			window.addEventListener( 'resize', onWindowResize, false );
				

		}
	
	}else{

		renderer = $('a-scene')[0].renderer;

		camera = $('#vr-camera')[0].object3D;
		camera.position.set( cameraPosition.x, cameraPosition.y, cameraPosition.z );
	}

	//Events binding
	if(vr_mode){

		document.addEventListener("touchend", checkTreeLabelClick, true);
		document.addEventListener("mouseup", checkTreeLabelClick, true);
	
		if(lightSpotEnabled){
			document.addEventListener("touchend", checkLightSpotFocus, true);
			document.addEventListener("mouseup", checkLightSpotFocus, true);
		}
			
		if(showTags && tagClickable){
			document.addEventListener("touchend", checkTagFocus, true);
			document.addEventListener("mouseup", checkTagFocus, true);
		}

	}else{

		$('canvas').on('touchstart', function(e){
			
			if(lightSpotEnabled){
				checkLightSpotFocus(true);
			}
		
			if(showTags && tagClickable){
				checkTagFocus(true);
			}

		}).on('mousedown', function(e){
			
			if(lightSpotEnabled){
				checkLightSpotFocus(true);
			}
		
			if(showTags && tagClickable){
				checkTagFocus(true);
			}

		}).on('mousemove', function(e){
			
			if(lightSpotEnabled){
				checkLightSpotFocus(false);
			}
		
			if(showTags && tagClickable){
				checkTagFocus(false);
			}

		});

	}
		
	
	//Setup chracter id
	var my_character_id = localStorage.getItem('my-character-id');
	
	if(!my_character_id){
		character_id = Math.random().toString(36).substr(2, 9);
		localStorage.setItem('my-character-id',character_id );
	}else{
		character_id = my_character_id;
	}
	

	//Build terrain
	
	terrain = new Terrain();
	terrain.width = panorama_mode ? 100 : 50;
	terrain.height = panorama_mode ? 100 : 50;
	terrain.init();
	
	scene.add(terrain.mesh);
	
	if(useCachedTerrainPath){
		$.ajax({
			url: panorama_mode ? 'data/position/terrain-curves-360.json' : 'data/position/terrain-curves.json',
			dataType:'json',
			async:false
		}).done(function(res){
			terrainPathData = res;
		});
	}	
		
	//Add trees	
	if(treesEnabled){
		
		$.ajax({
			url:'api/?act=getCurrentTags',
			dataType:'json',
			async:false
		}).done(function(res){
			//console.log(res);
			collegesData = res;
		});
	
		jQuery.each( collegesData.colleges, function(index, value){
			
			if(panorama_mode){

				if(static_mode){

					//Static position
					var x = parseFloat(value.position_360.x);
					var y = parseFloat(value.position_360.y);
					var z = parseFloat(value.position_360.z);

				}else{

					var angle = THREE.Math.degToRad((360 / collegesData.colleges.length) * index + 1);
					var range = THREE.Math.randFloat(35, 38);
					var x = Math.cos(angle) * range;
					var z = Math.sin(angle) * range;
					terrain.raycaster.set(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
					var intersects = terrain.raycaster.intersectObjects([terrain.mesh]);
					var y = intersects[0].point.y;

				}

			}else{
			
				if(static_mode){

					//Static position
					var x = parseFloat(value.position.x);
					var y = parseFloat(value.position.y);
					var z = parseFloat(value.position.z);

				}else{

					//Dynamic position
					var x = THREE.Math.randFloat(-15, 15);
					var z = THREE.Math.randFloat(-15, 15);
					terrain.raycaster.set(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
					var intersects = terrain.raycaster.intersectObjects([terrain.mesh]);
					var y = intersects[0].point.y;

				}
			}
			
			
			var labels = [];
			var colors = [];
		
			for(var j = 0; j < value.depts.length; j++){
				labels.push({
					label:value.depts[j].dept_label, 
					labelColor:value.depts[j].dept_label_color, 
					id:value.depts[j].dept_id
				});
				
				colors.push(particleColorSchema[j % particleColorSchema.length]);
			}
		
			var tree = new Tree();
			tree.label = value.college_label;
			tree.labelColor = value.college_label_color;
			tree.id = value.college_id;
			tree.x = x;
			tree.z = z;			
			tree.y = y;
			tree.branchHeight = panorama_mode ? parseInt(THREE.Math.randFloat(13.5, 17)) : parseInt(THREE.Math.randFloat(10, 20));
			tree.branchRadius = panorama_mode ? THREE.Math.randFloat(.4, .5) : THREE.Math.randFloat(.2, .3); //Bold
			tree.branchNum1 = value.depts.length;
			tree.branchNum2 = 3;
			tree.branchRotStart = THREE.Math.randFloat(0, 360);
			tree.branchRotY = THREE.Math.randFloat(60, 90);
			tree.branchRotZ = panorama_mode ? THREE.Math.randFloat(45, 75) : THREE.Math.randFloat(35, 55);
			tree.branchLabel = labels;
			tree.branchColor = colors;
			tree.terrain = terrain; //For generate terrain path in Branch
			tree.maxParticleNum = value.depts.length * particlesPerDept * 2;
			tree.init();
			trees.push(tree);			
			
			treeLabelSenser.push(tree.labelSphere);
			
		});
		
		//Generate and save terrain path	
		if(generateTerrainPath){
			
			jQuery.each(terrainPathTmpData, function(key, val){
				for(var i = 0; i < terrainPathTmpData[key].length; i++){
					for(var j = 0; j < terrainPathTmpData[key][i].length; j++){
						terrainPathTmpData[key][i][j].x = parseFloat(terrainPathTmpData[key][i][j].x.toFixed(6));
						terrainPathTmpData[key][i][j].y = parseFloat(terrainPathTmpData[key][i][j].y.toFixed(6));
						terrainPathTmpData[key][i][j].z = parseFloat(terrainPathTmpData[key][i][j].z.toFixed(6));
					}
				};
			});
			
			$.ajax({
				url:'api/?act=saveTerrainCurve',
				type:'post',
				data:{data:JSON.stringify(terrainPathTmpData), mode: panorama_mode ? '360' : 'default'}
			}).done(function(res){});
		
		}
		
		//Build tags
		buildTags();
		
		//Add light spots
		if(lightSpotEnabled){
			
			for(var i = 0; i < lightSpotNum; i++){
				setTimeout(function(){
				
					var randomTreeIndex = Math.floor(Math.random() * collegesData.colleges.length);
					var x = trees[randomTreeIndex].x + THREE.Math.randFloat(-1, 1);
					var y = trees[randomTreeIndex].y + 4.25
					var z = trees[randomTreeIndex].z + 4;
				
					addLightSpot( trees[randomTreeIndex], x, y, z, .006 );
					
				}, (5 + Math.random()*10)*1000);
				
			}
			
		}
		
	}
	
	//Init UI
	initMessageUI();
	initFormUI();
		
	//Build GUI
	if(showDatGUI){
		buildGUI(collegesData);
	}
		
	//Load latest character data
	if(charactorEnabled){
		loadCharacterData();
	}

	//Build QR-code
	if(!vr_mode && qrCodeEnabled && $('#qrcode').length > 0){
		$('#qrcode-body').qrcode({width: 96,height: 96,text: $('#qrcode-body').attr('data-url')});
		$('#qrcode').show();
	}

	//Load sound pool
	if(soundEnabled){
		for(var i = 0; i < 2; i++){
			sound_dp.push(new Audio(use_cdn+'assets/sound/dopper-1.mp3'));
			sound_dp.push(new Audio(use_cdn+'assets/sound/dopper-2.mp3'));
			sound_dp.push(new Audio(use_cdn+'assets/sound/dopper-3.mp3'));
			sound_dp.push(new Audio(use_cdn+'assets/sound/dopper-4.mp3'));
			sound_dp.push(new Audio(use_cdn+'assets/sound/dopper-5.mp3'));
		}

		sound_bg.push({src:new Audio(use_cdn+'assets/sound/piano.mp3'), vol:1});
		sound_bg.push({src:new Audio(use_cdn+'assets/sound/string.mp3'), vol:1});
	}

	//Webcam
	//$('#enter-button').click(function () {
		
		var webcam_started = true;
	
		if(vr_mode && webcamEnabled){
			
			var video = document.querySelector("#webcam");
			video.controls = false; 
		
			if (navigator.mediaDevices.getUserMedia) {
	
				navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
					  facingMode: 'environment'
					}
				  })
				.then(function (stream) {
					video.srcObject = stream;
				})
				.catch(function (error) {
					console.log("Cannot access webcam");
					console.log(error);
					$('body').addClass('dark-bg');
					webcam_started = false;
				});
			}
	
		}else{
			$('body').addClass('dark-bg');
			webcam_started = false;
		}
	
		if(webcam_started){
			renderer.alpha = true;
			renderer.setClearColor( 0x041129, .82 );
		}

	//});
	
	animate();

	/*
	//For testing lightSpot
	$('canvas').click(function(){

		for(var i = 0; i < trees.length; i++){
			
			var tree = trees[i];
			var x = tree.x + THREE.Math.randFloat(-1, 1);
			var y = tree.y + 4.25
			var z = tree.z + 4;
			addLightSpot( tree, x, y, z, .006 );

		}

	});
	*/

}


function onWindowResize() {

	if(panorama_mode){

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		
		var width = window.innerWidth / panorama_camera_num;
		var height = window.innerHeight;

		for ( var i = 0; i < panorama_camera_num; i++ ) {
			var subcamera = camera.cameras[i];
			subcamera.viewport = new THREE.Vector4( Math.floor( i * width ), 0, Math.ceil( width ), Math.ceil( height ) );
			subcamera.updateMatrixWorld();
		}

		renderer.setSize( window.innerWidth, window.innerHeight );

	}else{

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		
		//Resize text
		resizeIntro();

	}
	
}

function resizeIntro(){
	
	$('.form-step .inner').each(function(){
		
		var mt = ( $(window).height() - $(this).outerHeight()) * .5;
		
		if(mt < 50){
			mt = 50;
		}
		
		$(this).css('margin', mt+'px auto');
	});
}

function buildGUI(){
	
	gui = new dat.GUI();
	gui.add( dataController, 'updateData');
	
	var cameraFocusOptions = {'FRONT':'FRONT', 'TOP':'TOP', 'CENTER':'CENTER'};
	
	jQuery.each( collegesData.colleges, function(index, value){
		cameraFocusOptions[value.college_label] = value.college_id;
	});
	
	gui.add(dataController, 'cameraFocus', cameraFocusOptions).onChange(function(){
		moveCameraTo(dataController.cameraFocus);
	});
	
}

function moveCameraTo( view ){
	
	if( view == 'FRONT'){
		
		cameraPositionTo = { x:0, y:12, z:26 };
		controlPositionTo = { x:0, y:10, z:0 };
		
	}else if( view == 'TOP'){
		
		cameraPositionTo = { x:0, y:32, z:0 };
		controlPositionTo = { x:0, y:0, z:0 };
		
	}else if( view == 'CENTER'){
		
		cameraPositionTo = { x:0, y:6, z:2 };
		controlPositionTo = { x:0, y:6, z:0 };
		
	}else{
		
		for(var i = 0; i < trees.length; i++){
			
			if(trees[i].id == view){
				
				var x = trees[i].x;
				var y = trees[i].y;
				var z = trees[i].z;
				
				cameraPositionTo  = { x:x, y:7, z:z+10 };
				
				/*
				if(vr_mode){
					cameraPositionTo  = { x:x, y:7, z:z+6 };
				}else{
					cameraPositionTo  = { x:x, y:6, z:z-4 };
				}
				*/
				
				controlPositionTo = { x:x, y:7, z:z };					
				break;
			}
		}
	}
}


function animate(now) {

	current_time = now;

	//Update tag data
	if(now - tagLastUpdate >= tagUpdateInterval*1000) {
        tagLastUpdate = now;
        loadTagData();
    }
	
	//Update position data
	if( charactorEnabled && (now - characterLastUpdate >= characterUpdateInterval*1000)) {
        characterLastUpdate = now;
        loadCharacterData();
    }

	//Reveal new message
	if( revealNewMessage && (now - revealLastCheck >= revealCheckInterval*1000)){
		revealLastCheck = now;
		loadNewMessage();
	}

	requestAnimationFrame( animate );
	
	if(!vr_mode && !panorama_mode){
		controls.update();
	}
	
	render();
	
}
			
function render() {
	
	
	//Update particles and leaves
	for(var i = 0; i < trees.length; i++){	
		
		var tree = trees[i];
		
		//Update particles
		var positions = tree.particlesGeometry.attributes.position.array;
			
		for(var j = 0; j < tree.particles.length; j++){
			
			var particle = tree.particles[j];
			particle.update();
			
			for(var k = 0; k < particle.childNum; k++){
				positions[particle.bufferIndex[k] * 3]     = particle.currentPosition[k].x;
				positions[particle.bufferIndex[k] * 3 + 1] = particle.currentPosition[k].y;
				positions[particle.bufferIndex[k] * 3 + 2] = particle.currentPosition[k].z;
			}
			
		}		
		tree.particlesGeometry.attributes.position.needsUpdate = true;
		
		//Update leaves
		var positions = tree.leavesGeometry.attributes.position.array;
		
		for(var j = 0; j < tree.leaves.length; j++){
			
			var leave = tree.leaves[j];
			leave.update();
			
			positions[leave.index * 3]     = leave.x;
			positions[leave.index * 3 + 1] = leave.y;
			positions[leave.index * 3 + 2] = leave.z;
			
		}		
		tree.leavesGeometry.attributes.position.needsUpdate = true;
		
	}
	
	//lightGroup.quaternion.copy(camera.quaternion);
	
	//Move camera
	var cameraDist = cameraPosition.distanceTo(cameraPositionTo);
	var controlDist = controlPosition.distanceTo(controlPositionTo);
	
	if(cameraDist > .1 || controlDist > .1){
		
		cameraPosition.x += (cameraPositionTo.x-cameraPosition.x) * cameraEasing;
		cameraPosition.y += (cameraPositionTo.y-cameraPosition.y) * cameraEasing;
		cameraPosition.z += (cameraPositionTo.z-cameraPosition.z) * cameraEasing;
		controlPosition.x += (controlPositionTo.x-controlPosition.x) * cameraEasing;
		controlPosition.y += (controlPositionTo.y-controlPosition.y) * cameraEasing;
		controlPosition.z += (controlPositionTo.z-controlPosition.z) * cameraEasing;
		
		camera.position.set( cameraPosition.x, cameraPosition.y, cameraPosition.z );
		
		if(!vr_mode){
			controls.target.set( controlPosition.x, controlPosition.y, controlPosition.z );
			controls.update();
		}else{
			camera.lookAt( controlPosition.x, controlPosition.y, controlPosition.z );
		}
	}
	
	if(cameraDist < .5 && controlDist < .5){
		if(cameraMoveCallback !== false){
			cameraMoveCallback();
			cameraMoveCallback = false;
		}
	}
	
	//Update character status
	if(!vr_mode){
		
		for(var i = 0; i < characters.length; i++){
			if(characters[i].live){
				if(characters[i].sprite.material.opacity < 1){
					characters[i].sprite.material.opacity = Math.min(characters[i].sprite.material.opacity + .01, 1);
				}
			}else{
				if(characters[i].sprite.material.opacity > 0){
					characters[i].sprite.material.opacity = Math.max(characters[i].sprite.material.opacity - .01, 0);
				
					if(characters[i].sprite.material.opacity == 0){
						
						characters[i].sprite.material.dispose();
						scene.remove(characters[i]);
						characters.splice(i, 1);
					}
				}
				
			}
		}
	}
	
  
	//Update light spot
	for(var i = 0; i < lightSpots.length; i++){
		
		lightSpots[i].update();
		
		if(lightSpots[i].status == 0){//Dead lightSpot
			lightSpots[i].sprite.material.dispose();
			lightSpots[i].sphere.material.dispose();
			scene.remove(lightSpots[i].sphere);
			scene.remove(lightSpots[i].sprite);
			lightSpots.splice(i, 1);
		}
		
	}
	
	if(!vr_mode){
		renderer.render( scene, camera );
	}
	
}


/*
========================
Trees
========================
*/
function checkTreeLabelClick(){

	clearTimeout(treeLabelClickTimeout);	
	treeLabelClickTimeout = setTimeout(function(){
		
		if(treeLabelSenser.length > 0){
		
			var raycaster = $('#vr-ray')[0].components.raycaster.raycaster;	
		
			for(var i = 0; i < treeLabelSenser.length; i++){
			
				var intersects = raycaster.intersectObject( treeLabelSenser[i] );
			
				if ( intersects.length > 0 ) {
					var id = treeLabelSenser[i].name.split('-')[1];
					moveCameraTo(id);
					break;
				}	
			}
		}	
	},50);
}

function getTreeById( id ){
	
	for(var i = 0; i < trees.length; i++){
		if(trees[i].id == id){
			return trees[i];			
		}
	}
	
	return null;
}


/*
========================
Tags
========================
*/
function loadTagData(){
	
	$.ajax({
		url:'api/?act=getCurrentTags',
		dataType:'json'
	}).done(function(res){
		collegesData = res;
		buildTags();
	});
	
}

function buildTags(){
	
	var particle_per_tag = collegesData.total_tags < minParticles ? Math.floor(minParticles / collegesData.total_tags) : 1;
	
	//For each tree
	jQuery.each( collegesData.colleges, function(index, value){
		
		var tree = trees[index];
		tree.resetParticles();
		
		for(var j = 0; j < value.depts.length; j++){
				
			//Found end branches
			var endBranchesIndex = [];
		
			for(var k = 0; k < tree.branches.length; k++){
				if(tree.branches[k].level == 0 && tree.branches[k].id == value.depts[j].dept_id){//is end branch
					endBranchesIndex.push(k);
				}
			}
					
			//Add particles
			if(value.depts[j].tags.length <= 0){
				for(var i = 0; i < 10; i++){
					value.depts[j].tags.push({label:''});
				}
			}
					
			$.each(value.depts[j].tags, function(tag_index, tag_value){
								
				for(var n = 0; n < particle_per_tag; n++){ //For each tag we add N particles to make it more compact
					
					var idx = endBranchesIndex[Math.floor(Math.random() * endBranchesIndex.length)];
					var branchSpeed = THREE.Math.randFloat(0.0004, 0.0009);
					var terrainSpeed = THREE.Math.randFloat(0.002, 0.004);
					var c = tree.branches[idx].color;
									
					tree.addParticle(idx, branchSpeed, terrainSpeed, value.college_id, value.depts[j].dept_id, c, tag_value.label);
				} 
			});	
		}
	});
}

function checkTagFocus(showMessage){

	//Add a timer to fix trigger event twice
	if(vr_mode && current_time - tagLastCheck < 1000) {
		tagLastCheck = current_time;
        return false;
    }

	tagLastCheck = current_time;

	var selectedTag = false;

	if(vr_mode){

		var raycaster = $('#vr-ray')[0].components.raycaster.raycaster;	

		for(var i = 0; i < tags.length; i++){
			
			var intersects = raycaster.intersectObject( tags[i].box );
				
			if ( intersects.length > 0 ) {
	
				selectedTag = intersects[0].object;
				showMessage = true;

				//console.log(intersects[0].object.label, intersects[0].object.college_id, intersects[0].object.dept_id);
	
				break;
			}	
		}

	}else{

		$('body').removeClass('cursor-tag');
	
		if(event.touches !== undefined){
			mousePosition.x = ( event.touches[0].clientX / window.innerWidth ) * 2 - 1;
			mousePosition.y =  - ( event.touches[0].clientY / window.innerHeight ) * 2 + 1;
		}else{
			mousePosition.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mousePosition.y =  - ( event.clientY / window.innerHeight ) * 2 + 1;
		}
		
		mouseRaycaster.setFromCamera(mousePosition, camera);

		for(var i = 0; i < tags.length; i++){
			
			var intersects = mouseRaycaster.intersectObject( tags[i] );
				
			if ( intersects.length > 0 ) {
				
				if(!messageDom.hasClass('show')){
					$('body').addClass('cursor-tag');
				}
				selectedTag = intersects[0].object;
				//console.log(intersects[0].object.label, intersects[0].object.college_id, intersects[0].object.dept_id);
	
				break;
			}	
		}

	}

	if(showMessage && selectedTag !== false && !messageDom.hasClass('show')){
			
			//Add light spot
			var half = selectedTag.position.y * .5;
			var x = selectedTag.position.x;// + THREE.Math.randFloat(-1, 1);
			var y = selectedTag.position.y - half;
			var z = selectedTag.position.z;// + THREE.Math.randFloat(-1, 1);
			addLightSpot( selectedTag.tree, x, y, z, .006, half + .5, selectedTag.label );
			
			var selectedIndex = lightSpots.length - 1;

			//Move to light spot and open message
			setTimeout(function(){

	
				lightSpots[selectedIndex].focused = true;
				
				//Load message
				loadMessage(selectedIndex);
				
				//Move camera to tree
				moveCameraTo(lightSpots[selectedIndex].tree.id);
				
				//Show message card	
				cameraMoveCallback = function(){
					messageDom.addClass('show');
				}
			
				lastFocusedLightSpotIndex = selectedIndex;

			}, 1000);
	}

}

/*
========================
LightSpot
========================
*/
function addLightSpot(tree, x, y, z, easing, startOffsetY, keyword){
	
	var lightSpot = new LightSpot();
					
	lightSpot.tree = tree;					
	lightSpot.x = x;
	lightSpot.y = y;
	lightSpot.z = z;
	lightSpot.easing = easing;

	if(startOffsetY){
		lightSpot.startOffsetY = startOffsetY;
	}

	if(keyword){
		lightSpot.keyword = keyword;
	}
						
	lightSpot.init();
	lightSpots.push(lightSpot);
	
	return lightSpot;		
}

function checkLightSpotFocus(showMessage){

	var selectedIndex = false;
	$('body').removeClass('cursor');
	
	for(var i = 0; i < lightSpots.length; i++){
		
		if(lightSpots[i].status == 1){
			
			var object = [lightSpots[i].sphere];
			
			if(vr_mode){
				var raycaster = $('#vr-ray')[0].components.raycaster.raycaster;			
				var intersects = raycaster.intersectObjects(object);
			}else{
				if(event.touches !== undefined){
					mousePosition.x = ( event.touches[0].clientX / window.innerWidth ) * 2 - 1;
  					mousePosition.y =  - ( event.touches[0].clientY / window.innerHeight ) * 2 + 1;
				}else{
					mousePosition.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  					mousePosition.y =  - ( event.clientY / window.innerHeight ) * 2 + 1;
				}
				mouseRaycaster.setFromCamera(mousePosition, camera);
				var intersects = mouseRaycaster.intersectObjects(object);
			}
			
 			if (intersects.length > 0) {
 				selectedIndex = i;
				$('body').addClass('cursor');

				if(vr_mode){
					showMessage = true;
				}

				break;
			}
		}
		
	}
	
	if(showMessage && selectedIndex !== false){
		
		if(selectedIndex !== lastFocusedLightSpotIndex && !messageDom.hasClass('show')){
			
			console.log('Focus on spotLight : '+selectedIndex);
		
			lightSpots[selectedIndex].focused = true;
			
			//Load message
			loadMessage(selectedIndex);
			
			//Move camera to tree
			moveCameraTo(lightSpots[selectedIndex].tree.id);
			
			//Show message card	
			cameraMoveCallback = function(){
				messageDom.addClass('show');
			}
		
			lastFocusedLightSpotIndex = selectedIndex;
		}
		
	}
	
}

/*
========================
Form
========================
*/
function initFormUI(){
	
	$('#form-intro button').click(function(){
		$('#form-intro').removeClass('show');
		setTimeout(function(){
			$('#form-body').addClass('show');
		}, 800);
	});
	
	$('#form-seed button').click(function(){
		lightSpots[0].status = 3;
		$('#form-seed').removeClass('show');
		setTimeout(function(){
			$('#form-finish').addClass('show');
		}, 600);
	});
	
	$('#form-body form').submit(function(e){
		
		var form = $(this);
		var smt = form.find('[type="submit"]').attr('disabled', 'disabled');
		var msg = form.find('.msg').hide().empty();
		
		$.ajax({
			url:'load.php?action=get-token',	
		}).done(function(token){
			$('#form-body form [name="token"]').val(token);	
			
			$.ajax({
				url:'load.php?action=feedback',
				method:'POST',
				data:form.serialize(),
				dataType:'json'
			}).done(function(res){
			
				if(res.msg){
					msg.html(res.msg).show();
					$('#form-body').scrollTop(0);
				}
				
				if(res.status == 1){
					form.find('input, textarea').val('');
					$('#form-body').removeClass('show');
					setTimeout(function(){
					
						//Add seed
						var lightSpot = new LightSpot();
				
						lightSpot.fadeoutRate = .5;
						lightSpot.scale = 4;						
						lightSpot.x = 0;
						lightSpot.y = 6;
						lightSpot.z = 0;
						lightSpot.easing = .008;
						
						lightSpot.init();
						lightSpots.push(lightSpot);
	
						setTimeout(function(){

							$('#form-seed').addClass('show');

							//panorama-from							
							if($('.panorama-from').length > 0){
								setTimeout(function(){
									lightSpot.status = 3;
								}, 3000);
							}

						}, 1500);
					}, 1500);
				}
			
				smt.removeAttr('disabled');
			});
			
		});
			
		e.preventDefault();
		
	});
	
}

/*
========================
Message
========================
*/
function initMessageUI(){
	
	$('#message-card .close').click(function(){
		removeMessage();
	});
	
	
}

function loadMessage(selectedSpotLightIndex){
	
	var lightSpot = lightSpots[selectedSpotLightIndex];
	
	$.ajax({
		url:'api/?act=loadMessage&college_id='+lightSpot.tree.id+'&keyword='+(lightSpot.keyword?lightSpot.keyword:''),
		dataType:'json'
	}).done(function(res){
		
		//Update message card
		messageDom.find('.dept').html(res.dept);
		messageDom.find('.date').html(res.date);
		messageDom.find('.content').html(res.content);
		
		
		//Send data to server to share our position
		if(vr_mode){
			$.ajax({
				url:'api/?act=addCharacter&character_id='+character_id+'&college_id='+lightSpot.tree.id+'&label='+lightSpot.tree.label
			}).done(function(res){
				console.log(res);
			});
		}
			
	});
				
}

function removeMessage(){
	
	if(lastFocusedLightSpotIndex !== false){
		
		//Hide message card
		messageDom.removeClass('show');
		clearTimeout(messageFocusTimeout); //For vr mode
		
		//Remove light spot
		lightSpots[lastFocusedLightSpotIndex].status = 2;
		lightSpots[lastFocusedLightSpotIndex].focused = false;
		
		$.ajax({
			url:'api/?act=updateCharacter&character_id='+character_id+'&college_id='+lightSpots[lastFocusedLightSpotIndex].tree.id+'&label='+lightSpots[lastFocusedLightSpotIndex].tree.label+'&last_action=close'
		}).done(function(res){
		});
		
		//Add new light spot
		if(!lightSpots[lastFocusedLightSpotIndex].keyword){
			
			setTimeout(function(){
				
				var randomTreeIndex = Math.floor(Math.random() * collegesData.colleges.length);
				var x = trees[randomTreeIndex].x + THREE.Math.randFloat(-1, 1);
				var y = trees[randomTreeIndex].y + 4.25
				var z = trees[randomTreeIndex].z + 4;
					
				addLightSpot( trees[randomTreeIndex], x, y, z, .006 );
						
			}, 2000);
			
		}

		lastFocusedLightSpotIndex = false;
		
	}
}

function loadNewMessage(){

	$.ajax({
		url:'api/?act=loadNewMessage',
		dataType:'json'
	}).done(function(res){
		
		var template = $('.reveal-card.template'); 

		console.log('load-new-message : '+res.length);

		$.each(res, function(index, message){

			//Find tree index correspond to this message
			var tree_index = null;

			$.each(trees, function(index, value){
				if(value.id == message.college_id){
					tree_index = index;
				}
			});

			//Add seed
			var x = trees[tree_index].x + THREE.Math.randFloat(-2, 2);
			var y = trees[tree_index].y + THREE.Math.randFloat(2, 4);
			var z = trees[tree_index].z + 4;
					
			var lightSpot = addLightSpot( trees[tree_index], x, y, z, .006 );

			//Add message card
			var clone = template.clone();
			clone.removeClass('template');
			clone.find('.dept').html(message.dept);
			clone.find('.content').html(message.content);
			//clone.css('left', THREE.Math.randInt( $(window).width() * .2, $(window).width() * .8));
			//clone.css('top', THREE.Math.randInt( $(window).height() * .2, $(window).height() * .8));

			$('body').append(clone);

			setTimeout(function(){
				
				//var pos = getWorldToScreen(lightSpot.sphere, camera);
				var pos = getWorldToScreenInArrayCamera(lightSpot.sphere, camera);

				if(pos){
					
					clone.css('left', Math.max(20, Math.min(pos.x, window.innerWidth - 160 - 20 )) );
					clone.css('top', pos.y);
					clone.addClass('show');
					
					setTimeout(function(){
						clone.addClass('floating');
	
						setTimeout(function(){
							clone.removeClass('show').removeClass('floating');
							setTimeout(function(){
								clone.remove();
								lightSpot.status = 2;
							}, 1200);
						}, revealMessageDisplayTime * 1000);

					}, 1000);

				}
				
			}, 6000);

			//Play sound
			if(soundEnabled){
				var idx = soundIndex % sound_dp.length;
				sound_dp[idx].volume = .75;
				sound_dp[idx].play();
				soundIndex++;
			}

		});
			
	});

}

/*
========================
Characters
========================
*/
function loadCharacterData(){
	
	$.ajax({
		url:'api/?act=loadCharacters',
		dataType:'json'
	}).done(function(res){
		buildCharacters(res);
	});
	
}

function buildCharacters(res){
	
	//Add chararters
	jQuery.each(res, function(index, value){
		
		var t = getTreeById(value.college_id);
		
		if(!isCharacterExist(characters, value.character_id, value.college_id) && characters.length < characters_max_num){
			
				if(t != null){
					
					var sprite = new THREE.Sprite( new THREE.SpriteMaterial({ 
						map: new THREE.TextureLoader().load( use_cdn+"assets/character-"+THREE.Math.randInt(1, 4)+".png" ), 
						transparent:true,						
						depthTest : true,
        				depthWrite : false,
						opacity:0
					}));
					
					sprite.position.x = t.x + THREE.Math.randFloat(-1, 1);
					sprite.position.y = t.y + 1.25;
					sprite.position.z = t.z + THREE.Math.randFloat(-1, 1);
					sprite.scale.set(1.75, 2.5, 1);
					sprite.renderOrder = 10000;
					
					scene.add( sprite );
				
					//Create light ball
					var lightSpot = addLightSpot(
						t, 
						sprite.position.x, 
						sprite.position.y + 2, 
						sprite.position.z, 
						.006
					);
				
				
					//Save character & lightSpot data
					characters.push({
						character_id:value.character_id,							
						college_id:value.college_id,
						sprite: sprite,
						live: true,
						lightSpot:lightSpot 
					});
				
				}
							
		}else{ //If character already exists
			
			if(value.last_action == 'close'){
				
				for(var i = 0; i < characters.length; i++){
					if(characters[i].college_id == value.college_id){
						//characters[i].live = false;
						characters[i].lightSpot.status = 2; //Set light spot status to fade
					}
				}
			}
		}
	});
	
	//Remove characters
	for(var i = 0; i < characters.length; i++){
		
		if(!isCharacterExist(res, characters[i].character_id, characters[i].college_id)){
			characters[i].live = false;
			characters[i].lightSpot.status = 2; //Set light spot status to fade-out
		}
		
	}
}

function isCharacterExist( _array, character_id, college_id){
			
	for(var i = 0; i < _array.length; i++){
		if(_array[i].character_id == character_id && _array[i].college_id == college_id){
			return true;
		}
	}
	
	return false;
}


/*
========================
Mathmatics
========================
*/
function getWorldToScreen(obj, camera){
	
	const vector = new THREE.Vector3();
	const canvas = renderer.domElement; // `renderer` is a THREE.WebGLRenderer

	obj.updateMatrixWorld();  // `obj´ is a THREE.Object3D
	vector.setFromMatrixPosition(obj.matrixWorld);

	vector.project(camera); // `camera` is a THREE.PerspectiveCamera

	const x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
	const y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));


	return {x:x, y:y};

}

function getWorldToScreenInArrayCamera(obj, camera){

	var hfov_half = (360 / panorama_camera_num)/2;
	var subscreen_viewport_width = window.innerWidth / panorama_camera_num;
	var subscreen_viewport_height = window.innerHeight;

	var obj_angle = THREE.Math.radToDeg(Math.atan2(obj.position.z, obj.position.x));
	if(obj_angle < 0){ obj_angle += 360; }

	for ( var i = 0; i < camera.cameras.length; i++ ) {

		var vector = camera.cameras[i].getWorldDirection();
		var camera_angle = THREE.Math.radToDeg(Math.atan2(vector.z, vector.x));
		var camera_left_angle = camera_angle - hfov_half;
		var camera_right_angle = camera_angle + hfov_half;
		if(camera_right_angle < 0){ camera_right_angle += 360; }

		if(obj_angle >= camera_left_angle && obj_angle <= camera_right_angle){
			
			var subscreen_position = getWorldToScreen(obj, camera.cameras[i]);
			var scr_x = THREE.Math.mapLinear(subscreen_position.x, 0, window.innerWidth, 0, subscreen_viewport_width);
			var scr_y = THREE.Math.mapLinear(subscreen_position.y, 0, window.innerHeight, 0, subscreen_viewport_height);

			return {x: subscreen_viewport_width * i + scr_x, y:scr_y};

		}

	}
	
	return null;

}

function calcVerticalFov(hfov, view_width, view_height){

    var hfovRad = hfov * Math.PI / 180;
    var vfovRad = 2*Math.atan(Math.tan(hfovRad/2)*view_height/view_width);

    return vfovRad* 180 / Math.PI;
}