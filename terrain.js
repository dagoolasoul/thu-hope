var Terrain = function() {
	
	this.width = 50;
	this.height = 50;
	this.widthSegments = 100;
	this.heightSegments = 100;
	this.geometry;
	this.material;
	this.mesh;
	this.raycaster = new THREE.Raycaster();
	
	this.init = function(){
		
		if(static_mode){
			noise.seed(100);
		}
		
		this.geometry = new THREE.PlaneGeometry( this.width, this.height, this.widthSegments, this.heightSegments );
		this.geometry.rotateX( -Math.PI / 2 );
	
		for(var i = 0; i < this.geometry.vertices.length; i++){		
			var vertice = this.geometry.vertices[i];
			var offset = THREE.Math.mapLinear(noise.perlin2(vertice.x * .1, vertice.z * .1), -1, 1, 0, 1) * 6;
			vertice.y = offset;
		}
		
		this.geometry.verticesNeedUpdate = true;
	
		this.material = new THREE.MeshBasicMaterial( {color:new THREE.Color('rgb(90,240,255)') , wireframe:true, transparent:true, opacity:.07 } );
		this.mesh = new THREE.Mesh( this.geometry, this.material );
		
	}
	
	
	this.calculateTerrainPath = function(x, y, z){
		
		//Define start point, end point
		var endPoint = new THREE.Vector3(x, y, z);
		var startPoint = new THREE.Vector3( 
			endPoint.x + THREE.Math.randFloat(-12, 12),
			endPoint.y,
			endPoint.z + THREE.Math.randFloat(-12, 12)
		);
		
		//Generate points
		var pathPoints = [];
		
		for(var i = 0; i < 15; i++){
						
			var x = THREE.Math.mapLinear(i, 0, 19, startPoint.x, endPoint.x);
			var z = THREE.Math.mapLinear(i, 0, 19, startPoint.z, endPoint.z);
			
			this.raycaster.set(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
        	var intersects = this.raycaster.intersectObjects([this.mesh]);
			
			if(intersects.length > 0){
				var y = intersects[0].point.y;			
				pathPoints.push(new THREE.Vector3(x, y, z));
			}
		}
		
		var terrainCurve = new THREE.CatmullRomCurve3(pathPoints);
		var terrainCurveCache = [];
		
		for(var i = 0; i < 1; i += 0.004 ){
			var pt = terrainCurve.getPoint(i);
			terrainCurveCache.push(pt);
		}
		
		terrainCurveCache.push(endPoint);
		
		return {curve:terrainCurve, points:terrainCurveCache}
			
	}
	
}
