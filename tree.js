var Tree = function() {
	
	this.rootGroup = null;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.branchRadius = .15;
	this.branchHeight = 10;
	this.branchHeightSegments = 9;
	this.branchLevel = 3;
	this.branchNum1 = 6;
	this.branchNum2 = 4;
	this.branchNum3 = 2;
	this.branchRotStart = 0;
	this.branchRotY = 60;
	this.branchRotZ = 50;
	this.branchLabel = [];
	this.branchColor = [];
	
	this.branches = [];
	this.particles = [];
	this.particlesGeometry;
	this.particlesMaterial;
	this.particlesMesh;
	this.maxParticleNum = 5000;
	this.currentBufferIndex = -1;
	
	this.terrain = null;
	
	this.leaves = [];
	this.leavesGeometry;
	this.leavesMaterial;
	this.leavesMesh;
	this.maxLeavesNum = 3000;
	this.currentLeaveIndex = 0;
	
	this.id = '';
	this.label = '';
	this.labelColor = null;
	this.labelDom = null;
	this.labelSphere = null;
	
	this.tagGroup;
	
	this.staticTerrainCurveIndex = 0;
	
	this.init = function(){
		
		this.rootGroup = new THREE.Group();		
		this.rootGroup.position.x = this.x;
		this.rootGroup.position.y = this.y;
		this.rootGroup.position.z = this.z;
		
		//Create branch
		this.createBranch(this.branchLevel, this.rootGroup, this.branchRadius, this.branchHeight, this.branchHeightSegments, null, 0);

			
		//Initailize particles
		this.particlesGeometry = new THREE.BufferGeometry();
		var positions = new Float32Array( this.maxParticleNum * 3 );
		var colors = new Float32Array( this.maxParticleNum * 3 );
	
		for(var i = 0; i < this.maxParticleNum; i++){

			positions[ 3 * i ] = 0;
			positions[ 3 * i + 1 ] = 0;
			positions[ 3 * i + 2 ] = 0;

			colors[ 3 * i ] = 0;
			colors[ 3 * i + 1 ] = 0;
			colors[ 3 * i + 2 ] = 0;
		}
	
		this.particlesGeometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
		this.particlesGeometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
	
		this.particlesMaterial = new THREE.PointsMaterial( { size: panorama_mode ? .1 : .05, vertexColors: true, fog:false } );
		this.particlesMesh = new THREE.Points( this.particlesGeometry, this.particlesMaterial );
		this.particlesMesh.frustumCulled = vr_mode ? false : true;
	
		scene.add(this.particlesMesh);
		
		//Initailize leaves
		this.leavesGeometry = new THREE.BufferGeometry();
		var positions = new Float32Array( this.maxLeavesNum * 3 );
		var colors = new Float32Array( this.maxLeavesNum * 3 );
		
		for(var i = 0; i < this.maxLeavesNum; i++){

			positions[ 3 * i ] = 0;
			positions[ 3 * i + 1 ] = 0;
			positions[ 3 * i + 2 ] = 0;

			colors[ 3 * i ] = 0;
			colors[ 3 * i + 1 ] = 0;
			colors[ 3 * i + 2 ] = 0;
		}
	
		this.leavesGeometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
		this.leavesGeometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
		this.leavesGeometry.attributes.position.needsUpdate = true;
	
		this.leavesMaterial = new THREE.PointsMaterial( { size: .05, vertexColors: true } );
		this.leavesMesh = new THREE.Points( this.leavesGeometry, this.leavesMaterial );
		this.leavesMesh.frustumCulled = false;
	
		scene.add(this.leavesMesh);
		
		//Add label
		if(this.label != ''){
	
			var label = new SpriteText(this.label /*+'['+this.id+']'*/, panorama_mode ? .7 : .6);
			label.fontFace = textFont;
			label.fontWeight = 'bold';
			label.fontSize = textSize;
			label.position.x = this.x;
			label.position.y = this.y - 1;
			label.position.z = this.z;
			label.renderOrder = 100000;
			label.material.depthTest = false;
			label.color = this.labelColor ? this.labelColor : '#ffffff';
			scene.add(label);
			
			//Add sphere for interaction
			var geo = new THREE.SphereGeometry( 1, 10, 10 );
			var mat = new THREE.MeshBasicMaterial( {color: 0xff0000 , transparent:true, opacity:0, alphaTest:.5 } );
			var sphere = new THREE.Mesh( geo, mat );
			
			sphere.position.x = label.position.x;
			sphere.position.y = label.position.y;
			sphere.position.z = label.position.z;
			sphere.name = 'college-'+this.id;
			
			scene.add(sphere);
		
			this.labelSphere = sphere;
		}
		
		//Add tags group
		this.tagGroup= new THREE.Group();
		this.tagGroup.visible = showTags ? true : false;
		scene.add(this.tagGroup);
	}
	
	this.createBranch = function(level, group, radius, height, heightSegments, parentBranch, branchIndex){
		
		group.updateMatrixWorld();
		
		var points = [];
		
		//We use a Branch object to hold path information
		var b = new Branch();
		b.tree = this;
		b.parent = parentBranch;
		b.index = branchIndex;
		b.level = level;
		b.branchRadius = radius;
		b.rootRadius = this.branchRadius;
		
		if(parentBranch !== null){
			b.label = parentBranch.label;
			b.id = parentBranch.id;
		}
		
		for(var i = 0; i < heightSegments+1; i++){
			
			//Relative position
			var x = 0;
			var y = 0;
			var z = 0;
			
			if(i > 0){
				x = THREE.Math.randFloat(-1, 1)*radius*.92;
				z = THREE.Math.randFloat(-1, 1)*radius*.92;
				y = THREE.Math.mapLinear(i, 0, heightSegments, 0, height);
			}
			
			points.push(new THREE.Vector3(x, y, z));
			
			//World position
			var tmp = new THREE.Object3D();
				
			tmp.position.x = x;
			tmp.position.y = y;
			tmp.position.z = z;			
			group.add(tmp);
			
			var pt = new THREE.Vector3();
			tmp.getWorldPosition(pt);
			
			b.points.push(pt);
			
		}
		
		
		if(b.level == 0){ //We only place particle on end-branch, so apply curve-path calculation on level 0 to reduct unnecessary calculation
			b.createBranchPath();
			b.createTerrainPath(this.terrain);
		}
		
		//Set branch color
		//b.color = particleColorSchema[b.index % particleColorSchema.length];
		
		if(level == this.branchLevel){//Root
			b.color = this.branchColor[0];
		}else if(level == this.branchLevel - 1){//Each department
			b.color = this.branchColor[b.index];
		}else{
			b.color = b.parent.color;
		}
		
		//Add branch label
		if(level == this.branchLevel - 1 && this.branchLabel.length > 0){
			
			var lastPoint = b.points[b.points.length - 1];
			
			if(this.branchLabel[branchIndex]){
				b.label = this.branchLabel[branchIndex].label;
				b.labelColor = this.branchLabel[branchIndex].labelColor;
				b.id = this.branchLabel[branchIndex].id;
			}
			
			if(b.label && b.label != ''){
				var label = new SpriteText( b.label/*+'['+b.id+']'*/, panorama_mode ? .45 : .3);
				label.fontFace = textFont;
				label.fontWeight = 'bold';
				label.fontSize = textSize;
				label.position.x = lastPoint.x;
				label.position.y = lastPoint.y;
				label.position.z = lastPoint.z;
				label.renderOrder = 100000;
				label.material.depthTest = false;
				label.color = b.labelColor ? b.labelColor : '#ffffff';
				scene.add(label);
			}
			
		}
		
		//b.displayBranch();
		//b.displayPath();
		
		this.branches.push(b);
		
		
		//Generate child branches
		if(level > 0){
			
			var num = this.branchNum3;
			
			if(level == this.branchLevel){
				num = this.branchNum1;
			}else if(level == this.branchLevel-1){
				num = this.branchNum2;
			}
			
			var start_index = parseInt(points.length * .4);
			var end_index = parseInt(points.length * .9);
			var index_length = end_index - start_index;
			
			for(var i = 0; i < num; i++){
				
				var index = start_index + (i % index_length);
				var pt = points[index];
				
				var child = new THREE.Group();
				child.position.x = pt.x;
				child.position.y = pt.y;
				child.position.z = pt.z;
				child.rotation.x = 0;
				child.rotation.y = THREE.Math.degToRad( this.branchRotStart + i*this.branchRotY );
				child.rotation.z = THREE.Math.degToRad( this.branchRotZ );
			
				group.add(child);
				
				var next_radius = radius * THREE.Math.mapLinear(index, start_index, end_index, .7, .2);
				var next_height = parseInt(height * THREE.Math.mapLinear(index, start_index, end_index, .7, .3));
				
				if(next_height <= 0){
					next_height = 1;
				}
				
				this.createBranch(level-1, child, next_radius, next_height, heightSegments, b, i);
				
			}
			
		}
		
	}
	
	this.addParticle = function(branchIndex, branchSpeed, terrainSpeed, college_id, dept_id, color, label){
		
		if(this.currentBufferIndex <= this.maxParticleNum-1){
			
			var p = new Particle();
			
			p.college_id = college_id;
			p.dept_id = dept_id;
			p.label = label;
			
			p.tree = this;
			p.branch = this.branches[branchIndex];
			p.branchSpeed = branchSpeed;
			p.terrainSpeed = terrainSpeed;
			p.childNum = 2;
			p.color = color;//this.branches[branchIndex].color;
			
			//Set position and offset
			for(var i = 0; i < p.childNum; i++){
				
				p.currentPosition.push(new THREE.Vector3(0,0,0));
				p.bufferIndex.push( this.currentBufferIndex++ );
				
				var rr = this.branches[branchIndex].rootRadius;					
				var randAngle = THREE.Math.randFloat(0, Math.PI);
				
				p.offset.push( new THREE.Vector3(
					Math.cos(randAngle) * rr,
					THREE.Math.randFloat(-rr, rr),
					Math.sin(randAngle) * rr
				)) ;
			}
			
			//Set color
			for(var i = 0; i < p.childNum; i++){
				var colors = this.particlesGeometry.attributes.color.array;	
				colors[p.bufferIndex[i] * 3] = p.color.r;
				colors[p.bufferIndex[i] * 3 + 1] = p.color.g;
				colors[p.bufferIndex[i] * 3 + 2] = p.color.b;
			}
			
			this.particlesGeometry.attributes.color.needsUpdate = true;
		
			this.particles.push(p);
		}
		
	}
	
	this.resetParticles = function(){
		
		this.currentBufferIndex = 0;		
		this.particles = [];
		
		var positions = this.particlesGeometry.attributes.position.array;
			
		for(var i = 0; i < this.maxParticleNum; i++){
			positions[i * 3]     = 0;
			positions[i * 3 + 1] = 0;
			positions[i * 3 + 2] = 0;
		}	
			
		this.particlesGeometry.attributes.position.needsUpdate = true;
		
		var colors = this.particlesGeometry.attributes.color.array;
			
		for(var i = 0; i < this.maxParticleNum; i++){
			colors[i * 3]     = 255;
			colors[i * 3 + 1] = 255;
			colors[i * 3 + 2] = 255;
		}	
			
		this.particlesGeometry.attributes.color.needsUpdate = true;
	}
	
}

var Branch = function() {
	
	this.id = '';
	this.label = '';
	this.labelColor = '';
	
	this.tree = null;
	this.parent = null;
	this.level = 0;
	this.index = 0;
	this.rootRadius = 0; //Root radius
	this.branchRadius = 0; //Branch radius
	this.points = []; //Hold current branch points in world coordinate
	
	this.branchCurvePath = []; //Hold point from root to top in world coordinate, for creating curve
	this.branchCurve = null;
	this.branchCurveCache = [];
	
	this.terrainCurve = null;
	this.terrainCurveCache = [];
	
	this.leaveHierarchy = 0;
	this.leaveAccumulate = .02;
	this.leaveMaxHeight = THREE.Math.randFloat(2, 4);
	
	this.color = new THREE.Color(255,255,255);
	
	this.tagCount = 0;
	this.maxTagNum = 5;
	
	this.createBranchPath = function(){
		
		for(var i = this.points.length - 1; i >= 0; i--){
			this.branchCurvePath.push(this.points[i]);
		}
		
		if(this.parent != null){
			this.createParentPath(this.parent, this.points[0]);
		}
		
		this.branchCurvePath = this.branchCurvePath.reverse();		
		this.branchCurve = new THREE.CatmullRomCurve3(this.branchCurvePath);
		
		for(var i = 0; i < 1; i += 0.0008 ){
			var pt = this.branchCurve.getPoint(i);
			this.branchCurveCache.push(pt);
		}
		
		var pt = this.branchCurve.getPoint(1);
		this.branchCurveCache.push(pt);
	}
	
	this.createParentPath = function(parentBranch, endPoint){
		
		var flag = false;
		
		for(var i = parentBranch.points.length-1; i >= 0; i--){
			
			var pt = parentBranch.points[i];
			
			if(pt.x == endPoint.x && pt.y == endPoint.y && pt.z == endPoint.z){
				flag = true;
			}else if(flag == true){
				this.branchCurvePath.push(pt);
			}
		}
		
		if(parentBranch.parent != null){
			this.createParentPath(parentBranch.parent, parentBranch.points[0]);
		}
		
	}
	
	this.createTerrainPath = function(terrain){
		
		if(useCachedTerrainPath){
			
			var dataset = terrainPathData['tree-'+this.tree.id];
			this.terrainCurveCache = dataset[this.tree.staticTerrainCurveIndex % dataset.length];
			this.tree.staticTerrainCurveIndex++;
	
		}else{
			var data = terrain.calculateTerrainPath(this.tree.x, this.tree.y, this.tree.z);
		
			this.terrainCurve = data.curve;
			this.terrainCurveCache = data.points;
			
			if(generateTerrainPath){
				if(!terrainPathTmpData['tree-'+this.tree.id]){
					terrainPathTmpData['tree-'+this.tree.id] = [];
				}
				terrainPathTmpData['tree-'+this.tree.id].push(data.points);
			}
		}
		
		
	}
	
	this.displayBranch = function(){
		
		var geometry = new THREE.Geometry().setFromPoints( this.points );
		var material = new THREE.LineBasicMaterial( { color: 0xffffff } );
		var mesh = new THREE.Line(geometry, material);
		scene.add(mesh);
		
	}
	
	this.displayPath = function(){
		
		var geometry = new THREE.Geometry().setFromPoints( this.branchCurvePath );
		var material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
		var mesh = new THREE.Line(geometry, material);
		scene.add(mesh);
		
	}
	
	this.addLeave = function(color, label){
			
		//Calculate leave start position
		var branchEndPoint = this.points[ this.points.length - 1 ];

		var x = branchEndPoint.x + THREE.Math.randFloat(-.8, .8);
		var y = branchEndPoint.y + this.leaveHierarchy + THREE.Math.randFloat(-.1, .1);
		var z = branchEndPoint.z + THREE.Math.randFloat(-.8, .8);
		
		this.leaveHierarchy += this.leaveAccumulate;
		
		if(this.leaveHierarchy >= this.leaveMaxHeight){
			this.leaveHierarchy = 0;
		}
				
		if( this.tree.currentLeaveIndex < this.tree.maxLeavesNum ){
			
			//Create leave object to hold its data
			var leave = new Leave();
			leave.tree = this.tree;
			leave.branch = this;
			leave.x = x;
			leave.y = y;
			leave.z = z;
			leave.c = color;
			leave.index = this.tree.currentLeaveIndex;
			leave.college_id = this.tree.id;
			leave.dept_id = this.id;
			leave.label = label;
			leave.init();
			
			this.tree.leaves.push(leave);
			
			this.tree.currentLeaveIndex++;
		
		}else{
			
			//Find a leave object in pool status
			for(var i = 0; i < this.tree.leaves.length; i++){
				
				var leave = this.tree.leaves[i];
				
				if(leave.status == -1){
					leave.x = x;
					leave.y = y;
					leave.z = z;
					leave.c = color;
					leave.college_id = this.tree.id;
					leave.dept_id = this.id;
					leave.label = label;
					leave.status = 0;
					leave.init();
					
					break;
				}
			}
		}
	}
	
}

var Leave = function() {
	
	this.tree = null;
	this.branch = null;
	this.index = 0; //Index in tree (also the index in leaves BufferGeometry)
	this.status = 0; //-1: pool, 0: Idle, 1: Falling
	this.fallingRate = .1;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.speedX = THREE.Math.randFloat(.01, .02);
	this.speedY = -THREE.Math.randFloat(.01, .02);
	this.speedZ = THREE.Math.randFloat(.01, .02);
	this.c = new THREE.Color('rgb(255,255,255)');
	
	this.college_id = '';
	this.dept_id = '';
	this.label = '';
	this.labelSprite = null;
	
	this.checkFallingCount = 0;
	this.checkFallingInterval = 5 * 60;
	
	this.init = function(){
		
		/* Position will update in render() function in app.js
		this.tree.leavesGeometry.attributes.position.array[ this.tree.currentLeaveIndex * 3 ] = x;
		this.tree.leavesGeometry.attributes.position.array[ this.tree.currentLeaveIndex * 3 + 1] = y;
		this.tree.leavesGeometry.attributes.position.array[ this.tree.currentLeaveIndex * 3 + 2] = z;
		this.tree.leavesGeometry.setDrawRange( 0, this.tree.currentLeaveIndex );
		this.tree.leavesGeometry.attributes.position.needsUpdate = true;
		*/	
				
		this.tree.leavesGeometry.attributes.color.array[ this.index * 3] = this.c.r;
		this.tree.leavesGeometry.attributes.color.array[ this.index * 3 + 1] = this.c.g;
		this.tree.leavesGeometry.attributes.color.array[ this.index * 3 + 2] = this.c.b;
			
		this.tree.leavesGeometry.attributes.color.needsUpdate = true;
		
		//Add tag label
		if(showTags && this.label != ''){

			this.labelSprite = new SpriteText(this.label, panorama_mode ? .4 : .24);
			this.labelSprite.position.x = this.x;
			this.labelSprite.position.y = this.y - 1;
			this.labelSprite.position.z = this.z;
			this.labelSprite.renderOrder = 100000;
			this.labelSprite.material.depthTest = false;
			this.labelSprite.fontFace = textFont;
			this.labelSprite.fontWeight = 'bold';
			this.labelSprite.fontSize = textSize;
			this.tree.tagGroup.add(this.labelSprite);
			tags.push(this.labelSprite);

			//Add custom attribute for tag clickable
			this.labelSprite.label = this.label; 
			this.labelSprite.college_id = this.college_id; 
			this.labelSprite.dept_id = this.dept_id; 
			this.labelSprite.tree = this.tree; 

			//Add box for interaction with raycaster for VR mode
			var geometry = new THREE.BoxGeometry( .4, .4, .4 );
			var material = new THREE.MeshBasicMaterial( {color: 0xff0000, transparent:true, opacity:0, alphaTest:.5 } );
			var box = new THREE.Mesh( geometry, material );
			box.position.x = this.labelSprite.position.x;
			box.position.y = this.labelSprite.position.y;
			box.position.z = this.labelSprite.position.z;
			box.label = this.label;
			box.tree = this.tree;

			this.labelSprite.box = box; 
			this.tree.tagGroup.add(box);
		}
		
	}
	
	this.update = function(checkFalling){
		
		if(this.status == 0){ //Idle
			
			this.checkFallingCount++;
			
			if(this.checkFallingCount > this.checkFallingInterval){
				this.checkFallingCount = 0;
				
				if(Math.random() < this.fallingRate){
					this.status = 1;
				}
				
			}
			
		}else if(this.status == 1){
			
			this.x += this.speedX;
			this.y += this.speedY;
			this.z += this.speedZ;
			
			if(this.y <= 0){
				this.status = -1;
				this.x = 0;
				this.y = 0;
				this.z = 0;
				
				if(this.label != ''){
					this.tree.tagGroup.remove(this.labelSprite);
					this.branch.tagCount -= 1;
					//console.log("Remove tag : "+this.label);
				}
			}
		}
	}
}