"use strict";
$(document).on("pageshow", function(){
    scaleContentToDevice();

    var game = candyBird();
    game.init();
});




var scaleContentToDevice = function(){
	var contentheight;
	scroll(0, 0);
	var headerHeight = $("[data-role=header]:visible").outerHeight(),
		footerHeight = $("[data-role=footer]:visible").outerHeight(),
		viewportHeight = $(window).height(),
		$content = $("canvas"),
		contentMargins =  $content.outerHeight() - $content.height();

		contentheight = viewportHeight - headerHeight - footerHeight - contentMargins;

		$content.height( contentheight );
};

var candyBird = function(){
	
	var CANVAS_ID = 'testCanvas',
		SKY = 'sky',
		HILL = 'hill',
		GROUND = 'ground-bg',
		BIRD = 'bird',
		CLOUD = 'cloud';
	
	var stage,
		canvasWidth,
		canvasHeight,
		loader,
		sky,
		ground,
		bird,
		hill,
		cloud,
		groundImg,
		appStarted = false,
		finished = false,
		fallTimeout = null,
		birdJumpedTimeout,
		birdJumped = false,
		birdGoDown = false,
		birdGoDownTimeout,
		killBird = false,
		pipes = [],
		pipeInterval,
		point = 0;

	var random = function( min, max ){
		return Math.random() * (max - min) + min;
	};

	return {
		init: function(){


			window.requestAnimationFrame =
				window.requestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.msRequestAnimationFrame;

			//TODO: this peice of code should get reviewed
			if (window.top != window) {
				document.getElementById("header").style.display = "none";
			}

			//create stage
			stage = new createjs.Stage( CANVAS_ID );
			
			// grab canvas width and height for later calculations:
			canvasWidth = stage.canvas.width;
			canvasHeight = stage.canvas.height;

			this.loadResources();
		},

		loadResources: function(){

			var manifest = [
				{
					src: 'assets/candybird/sky.png',
					id: SKY
				},{
					src: 'assets/candybird/hill.png',
					id: HILL
				},{
					src: 'assets/candybird/bg.png',
					id: GROUND
				},{
					src: 'assets/candybird/bird-sprite.png',
					id: BIRD
				},{
					src: 'assets/candybird/cloud.png',
					id: CLOUD
				}
			];

			loader = new createjs.LoadQueue( false );

			loader.addEventListener( 'complete', this.onResourcesLoaded.bind(this) );

			loader.loadManifest( manifest );
		},

		onResourcesLoaded: function(){

			document.getElementById('loader').className = "";

			groundImg = loader.getResult( GROUND );
			
			this.buildSky();
			
			this.buildGround();
			
			this.buildHill();

			this.buildCloud();

			this.buildBird();
		
			stage.addChild(sky, hill, ground, bird, cloud);
			
			stage.addEventListener('stagemousedown', this.onStageClick.bind(this));

			createjs.Ticker.timingMode = createjs.Ticker.RAF;

			createjs.Ticker.addEventListener('tick', this.onTick.bind(this));
		},

		buildSky: function(){

			sky = new createjs.Shape();
		
			sky.graphics
				.beginBitmapFill( loader.getResult( SKY ) )
				.drawRect( 0, 0, canvasWidth, canvasHeight);
		
		},

		buildGround: function(){
			

			ground = new createjs.Shape();

			ground.graphics
				.beginBitmapFill( groundImg )
				.drawRect(0, 0, canvasWidth + groundImg.width * 12, groundImg.height);
			
			ground.tileWidth = groundImg.width;

			ground.y = canvasHeight - groundImg.height;

			ground.x = 0;

		},

		buildHill: function(){

			var hillImage = loader.getResult( HILL );
			
			hill = new createjs.Shape();

			hill.graphics
				.beginBitmapFill( hillImage )
				.drawRect(0, 0, canvasWidth + hillImage.width , hillImage.height);
			
			hill.tileWidth = hillImage.width;

			hill.y = canvasHeight - hillImage.height - groundImg.height;

			hill.x = 0;

		},

		buildBird: function(){

			var spriteData = new createjs.SpriteSheet({
				images: [
					loader.getResult( BIRD )
				],

				frames: {
					regX:	0,
					height: 50,
					count:	10,
					regY:	0,
					width:	48
				},

				// define two animations, run (loops, 1.5x speed) and jump (returns to run):
				animations: {
					fly:		[0, 3, "flyStead", 0.3],
					flyStead:	[3, 3, "flyStead", 0.3],
					ready:		[3, 3, "ready", 0.3],
					dead:		[9, 9, "dead", 0.3],
					fall:		[4, 8, "fallen", 0.3],
					fallen:		[8, 8, "fallen", 0.3],

				}
			});

			bird = new createjs.Sprite( spriteData, 'ready');

			bird.setTransform( -200, 90, 0.8, 0.8 );

			bird.framerate = 30;
			
			bird.x = 100;
			
			bird.width = 48;
			
			bird.height = 50;

		},

		buildCloud: function(){

			var cloudImage = loader.getResult( CLOUD);
			
			cloud = new createjs.Shape();

			cloud.graphics
				.beginBitmapFill( cloudImage )
				.drawRect( 0, 0, cloudImage.width , cloudImage.height );
			
			cloud.tileWidth = cloudImage.width;

			//vertical position of the cloud
			cloud.y = 30;

			// horizontal position of the cloud
			cloud.x = Math.random()  * canvasWidth;

		},

		onStageClick: function(){
			if(finished){
				return;
			}

			appStarted = true;


			if(!pipeInterval){
				pipeInterval = setInterval(this.buildPipe, 1500);
			}

			//grant.gotoAndPlay("jump");

			bird.gotoAndPlay('fly');

			if(birdJumpedTimeout){
				clearTimeout( birdJumpedTimeout );
			}

			if(birdGoDownTimeout){
				clearTimeout( birdGoDownTimeout );
			}

			birdJumped = true;
			birdGoDown = false;
			
			birdJumpedTimeout = setTimeout(function(){
				birdJumped = false;
				birdGoDown = true;

				birdGoDownTimeout = setTimeout(function(){
					birdGoDown = false;
					bird.gotoAndPlay('fall');
				}, 300);
			}, 300);
		},


		addPoint: function(){
			point += 1;
			console.log(point);
		},

		gameover: function(){
			console.log("Game Over");
			if( bird.y <=  ground.y - 30 ){
				killBird = true;
			}else{
				bird.gotoAndPlay("dead");
			}
			
			finished = true;

			clearInterval(pipeInterval);
			
			pipeInterval = null;
			
			point = 0;
		},

		onTick: function(event) {

			var deltaS = event.delta / 1000,
				speed = 150;

			// this flag is only on when the bird has been crashed and needs to die. we move the bird all the way down and kill it.

			if( killBird ){
				if(bird.y <=  ground.y - 30){
					bird.y = bird.y + 400 * deltaS;
				}else{
					killBird = false;
					bird.gotoAndPlay("dead");
				}
			}

			if( appStarted && !finished ){
				if(birdGoDown){

					bird.y = bird.y + 3;
				
				}else if( birdJumped ){
					//avoiding the bird to go off the screen
					if(bird.y <= 0){
						bird.y = 0;
					}else{
						bird.y = bird.y - 2;
					}
				}else if(bird.y <=  ground.y - 30){

					bird.y = bird.y + 400 * deltaS;
					
				}else{
					this.gameover();
				}
			
				ground.x = (ground.x - deltaS * speed) % (ground.tileWidth * 12);
				
				pipes.every(function(pipe, index){
					var pipeTop = pipe.top;
					var pipeBottom = pipe.bottom;

					// if bird is within pipe
					if( bird.x + bird.width >= pipeTop.x && bird.x <= pipeTop.x + pipeTop.width){

						// if bird crashes with pipe game over;
						if(bird.y  <= pipeTop.y + pipeTop.height ||  bird.y + bird.height >= pipeBottom.y){
						

							this.gameover();
							if(bird.y + bird.height >= pipeBottom.y){
								console.log("Bird Crashed with lower pipe", "Bird Position: ", bird.y + bird.height);
							}else{
								console.log("Bird Crashed with higher pipe");
							}
							console.log("bird x: ",
									bird.x,
									" Bird Y: ",
									bird.y,
									" Pipe Top Y: ",
									pipeTop.y + pipeTop.height,
									"Pipe Bottom Y ",
									pipeBottom.y);


							return false;
						}

					}else if( bird.x + bird.width >= pipeTop.x + pipeTop.width && pipe.active){
							// if bird has passed the pipe add a point
							pipe.active = false;
							this.addPoint();
						
					}

					// remove the pipe when it is off the screen;
					if(pipeTop.x < -1* pipeTop.width){
						pipes.splice(index, 1);
					}

					// animate pipe.
					pipeTop.x = pipeTop.x - deltaS * speed;
					pipeBottom.x = pipeBottom.x - deltaS * speed;
					return true;
					
				}.bind(this));

				// ainmate cloud
				cloud.x = (cloud.x - deltaS * 10) % canvasWidth;

				//if clould is off the screen bring it back from the right side
				if(cloud.x <=0){
					cloud.x = canvasWidth;
				}

				hill.x = (hill.x - deltaS * 20) % hill.tileWidth;
			
			}

			stage.update(event);
		
		},

		buildPipe: function(){
			var pipe = new createjs.Shape(),
				pipe2 = new createjs.Shape();

			var pipeHeight = random( 0.1 * canvasHeight, 0.5 * canvasHeight );
			var gap = 200;
			var pipe2Height = canvasHeight - pipeHeight - gap,
				pipeWidth = 40;
			
			pipe.graphics
				.beginLinearGradientFill(["#F03E8A","#fff"], [0, 1], 20, 0, 70, 0)
				.drawRect(0, 0, pipeWidth, pipeHeight);

			pipe.x = canvasWidth;
			pipe.y = canvasHeight -  pipeHeight - groundImg.height;
			pipe.width = pipeWidth;
			pipe.height = pipeHeight;

			pipe2.graphics
				.beginLinearGradientFill(["#F03E8A","#fff"], [0, 1], 20, 0, 70, 0)
				.drawRect(0, 0, pipeWidth, pipe2Height);

			pipe2.x = canvasWidth;
			pipe2.y = 0;
			pipe2.width = pipeWidth;
			pipe2.height = pipe2Height;
			
			
			stage.addChild( pipe );
			stage.addChild( pipe2 );

			pipes.push({
				bottom: pipe,
				top: pipe2,
				active: true
			});

			stage.update();

		}

	};
};