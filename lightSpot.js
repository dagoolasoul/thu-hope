var LightSpot = function() {
	
	this.tree = null;
	this.x = 0;
	this.y = 0;
	this.z = 0;	
	this.easing = .006;
	this.scale = 1;
	this.sprite = null;
	this.sphere = null;
	this.status = 1; //1:live, 2:move up and fadeout , 3:accept(move down and fade-out), 0:dead
	this.focused = false;
	this.fadeoutRate = 1; //For addSeedAnimation
	this.startOffsetY = 8;
	this.keyword = '';
	
	this.init = function(){
		
		var texture = new THREE.TextureLoader().load( "assets/lightSpot-1.png" );
		texture.premultiplyAlpha = ! texture.premultiplyAlpha;
		texture.needsUpdate = true;
		
		var sprite = new THREE.Sprite( new THREE.SpriteMaterial({ 
			map: texture,
			transparent:true,
			opacity: 0,
			depthTest : true,
        	depthWrite : false
			//fog:true
		}));
					
		sprite.position.x = this.x;
		sprite.position.y = this.y + this.startOffsetY;
		sprite.position.z = this.z;
		sprite.scale.set(0, 0, 1);
		sprite.renderOrder = 10000;
		
		scene.add( sprite );
		
		this.sprite = sprite;
		
		//Add sphere for interaction
		var geometry = new THREE.SphereGeometry( .55, 10, 10 );
		var material = new THREE.MeshBasicMaterial( {color: 0xff0000, transparent:true, opacity:0, alphaTest:.5 } );
		var sphere = new THREE.Mesh( geometry, material );
		
		scene.add(sphere);
		
		this.sphere = sphere;
	}
	
	this.update = function(){
		
		if(this.status == 1){
		
			this.sprite.position.x += (this.x - this.sprite.position.x) * this.easing;
			this.sprite.position.y += (this.y - this.sprite.position.y) * this.easing;
			this.sprite.position.z += (this.z - this.sprite.position.z) * this.easing;
		
		
			this.sprite.scale.x += (this.scale - this.sprite.scale.x) * this.easing;
			this.sprite.scale.y += (this.scale - this.sprite.scale.y) * this.easing;
			
			if(!this.focused){
				this.x += THREE.Math.randFloat(-.05, .05);
				this.y += THREE.Math.randFloat(-.05, .05);
			}
			
			if(this.sprite.material.opacity < 1){
				this.sprite.material.opacity += .1;
			}
			
			this.sphere.position.x = this.sprite.position.x;
			this.sphere.position.y = this.sprite.position.y;
			this.sphere.position.z = this.sprite.position.z;
			
		}else if(this.status == 2 || this.status == 3){
			
			if(this.sprite.material.opacity > 0){
				
				
				if(this.status == 2){
					this.sprite.material.opacity -= .01;
					this.sprite.position.y += .01;
					this.sprite.scale.x = Math.max(this.sprite.scale.x - .001, 0);
					this.sprite.scale.y = Math.max(this.sprite.scale.y - .001, 0);
					
					
					this.sphere.position.y = this.sprite.position.y;
			
				}else{
					
					this.sprite.material.opacity -= .02 * this.fadeoutRate;
					this.sprite.position.y -= .02;
					this.sprite.scale.x = Math.max(this.sprite.scale.x - .005/this.fadeoutRate, 0);
					this.sprite.scale.y = Math.max(this.sprite.scale.y - .005/this.fadeoutRate, 0);
					
					
					this.sphere.position.y = this.sprite.position.y;
				}
				
			}
			
			if(this.sprite.material.opacity <= 0){
				this.status = 0;
			}
			
		}
		
	}
}