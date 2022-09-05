var Particle = function() {
	
	this.tree = null;
	this.branch = null;
	this.status = 0; //0:Terrain, 1:Branch
	this.dead = false;
	this.branchSpeed = .005;
	this.terrainSpeed = .01;
	this.childNum = 2;
	this.t = THREE.Math.randFloat(0, 1);
	this.bufferIndex = [];
	this.currentPosition = [];
	this.offset = [];
	this.loopCount = 0;
	
	this.college_id = '';
	this.dept_id = '';
	this.label = '';
	
	this.update = function(){
		
		if(this.dead){
			
			for(var i = 0; i < this.childNum; i++){
				this.currentPosition[i].x = 0;
				this.currentPosition[i].y = -100;
				this.currentPosition[i].z = 0;
			}
			
		}else if(this.status == 0){
			
			if(this.t <= 1){ 				
				
				var idx = parseInt(THREE.Math.mapLinear(this.t, 0, 1, 0, this.branch.terrainCurveCache.length));
				var pt = this.branch.terrainCurveCache[idx];
				var offsetScale = THREE.Math.mapLinear(this.t, 0, 1, 1, 2);
				
				for(var i = 0; i < this.childNum; i++){
					
					var x = pt.x + this.offset[i].x * offsetScale;
					var y = pt.y;
					var z = pt.z + this.offset[i].z * offsetScale;
		
					this.currentPosition[i].x = x;
					this.currentPosition[i].y = y;
					this.currentPosition[i].z = z;
				}
			
				this.t += this.terrainSpeed;
				
			}else{
				this.t = 0; 
				this.status = 1; 
			}
		
			
			
		}else if(this.status == 1){
				
			if(this.t <= 1){ 
				
				var idx = parseInt(THREE.Math.mapLinear(this.t, 0, 1, 0, this.branch.branchCurveCache.length));
				var pt = this.branch.branchCurveCache[idx];
				
				for(var i = 0; i < this.childNum; i++){
					var x = pt.x + this.offset[i].x * (1 - this.t);
					var y = pt.y + this.offset[i].y * (1 - this.t);
					var z = pt.z + this.offset[i].z * (1 - this.t);
		
					this.currentPosition[i].x = x;
					this.currentPosition[i].y = y;
					this.currentPosition[i].z = z;
				}
			
				this.t += this.branchSpeed;
				
			}else{
				
				this.t = 0; 
				this.status = 0;
				
				this.loopCount++;
				
				if(this.loopCount >= loopUntilLeaveGrow){
					
					var leave_tag = '';
					
					if(Math.random() <= .02 && this.branch.tagCount < this.branch.maxTagNum ){
						leave_tag = this.label;
						this.branch.tagCount++;
					}
	
					this.branch.addLeave(this.branch.color, leave_tag);
					this.loopCount = 0;
				}
				
			}
			
		}
		
	}
}