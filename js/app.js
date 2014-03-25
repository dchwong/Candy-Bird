"use strict";
$(document).on("pageshow", function(){
    scaleContentToDevice();
    init();
});

var contentheight;
function scaleContentToDevice() {
	scroll(0, 0);
	var headerHeight = $("[data-role=header]:visible").outerHeight(),
		footerHeight = $("[data-role=footer]:visible").outerHeight(),
		viewportHeight = $(window).height(),
		$content = $("canvas"),
		contentMargins =  $content.outerHeight() - $content.height();

		contentheight = viewportHeight - headerHeight - footerHeight - contentMargins;

		$content.height( contentheight );
}


	window.requestAnimationFrame = 
		window.requestAnimationFrame || 
		window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || 
        window.msRequestAnimationFrame;

	var stage, w, h, loader;
	var sky, grant, ground, hill, hill2, groundImg, bird, appStarted = false, finished = false, fallTimeout = null,
		birdJumpedTimeout, birdJumped = false, birdGoDown = false, birdGoDownTimeout,killBird = false, cloud, pipes = [], pipeInterval, point = 0;

	function init() {
		if (window.top != window) {
			document.getElementById("header").style.display = "none";
		}

		stage = new createjs.Stage("testCanvas");
		
		// grab canvas width and height for later calculations:
		w = stage.canvas.width;
		h = stage.canvas.height;

		loadResources();

	}

	function buildSky(){

		sky = new createjs.Shape();
		
		sky.graphics.beginBitmapFill(loader.getResult("sky")).drawRect(0,0,w,h);

	}

	function buildGround(){
		groundImg = loader.getResult("ground-bg");

		ground = new createjs.Shape();

		ground.graphics
			.beginBitmapFill( groundImg )
			.drawRect(0, 0, w + groundImg.width * 12, groundImg.height);
		
		ground.tileWidth = groundImg.width;

		ground.y = h - groundImg.height;

		ground.x = 0;
	}

	function buildHill(){
		var hillBitmap = loader.getResult("hill");
		groundImg = loader.getResult("ground-bg");
		
		hill = new createjs.Shape();

		hill.graphics
			.beginBitmapFill( hillBitmap )
			.drawRect(0, 0, w + hillBitmap.width , hillBitmap.height);
		
		hill.tileWidth = hillBitmap.width;

		hill.y = h - hillBitmap.height - groundImg.height;

		hill.x = 0;

	}

	function buildBird(){
		var data = new createjs.SpriteSheet({
			images: [ 
				loader.getResult("bird")
			],

			frames: {
				regX: 0,
				height: 50,
				count: 10,
				regY: 0,
				width: 48
			},
			// define two animations, run (loops, 1.5x speed) and jump (returns to run):
			animations: {
				fly: [0, 3, "flyStead", .3], 
				flyStead: [3, 3, "flyStead", .3], 
				ready: [3, 3, "ready", .3],
				dead:[9, 9, "dead", .3],
				fall:[4,8, "fallen", .3],
				fallen:[8,8, "fallen", .3],

			}
		});

		bird = new createjs.Sprite(data, "ready");
		bird.setTransform(-200, 90, 0.8, 0.8);
		bird.framerate = 30;
		bird.x = 100;		
		bird.width = 48;
		bird.height = 50;

	}

	function loadResources(){
    
		var manifest = [
			{src:"assets/runningGrant.png", id:"grant"},
			{src:"assets/candybird/sky.png", id:"sky"},
			{src:"assets/candybird/hill.png", id:"hill"},
			{src:"assets/candybird/bg.png", id:"ground-bg"},
			{src:"assets/candybird/bird-sprite.png", id:"bird"},
			{src:"assets/candybird/cloud.png", id:"cloud"}

		];

		loader = new createjs.LoadQueue(false);

		loader.addEventListener("complete", handleComplete);

		loader.loadManifest(manifest);

	}

	function buildCloud(){
		var cloudBitmap = loader.getResult("cloud");
		
		cloud = new createjs.Shape();

		cloud.graphics
			.beginBitmapFill( cloudBitmap )
			.drawRect(0, 0, cloudBitmap.width , cloudBitmap.height);
		
		cloud.tileWidth = cloudBitmap.width;

		cloud.y = 30;

		cloud.x = Math.random()  * w;	
	}

	function handleComplete() {

		document.getElementById("loader").className = "";
		
		buildSky();
		
		buildGround();
		
		buildHill();

		buildCloud();

		buildBird();
	
		stage.addChild(sky, hill, ground, bird, cloud);
		
		stage.addEventListener("stagemousedown", handleJumpStart);

		createjs.Ticker.timingMode = createjs.Ticker.RAF;

		createjs.Ticker.addEventListener("tick", tick);


	}

	function random(min, max){
		return Math.random() * (max - min) + min;
	}

	function buildPipe(){
		var pipe = new createjs.Shape(),
			pipe2 = new createjs.Shape();

		var pipeHeight = random(.1 * h, .5 *h);
		var gap = 200;
		var pipe2Height = h - pipeHeight - gap,
			pipeWidth = 40;
		
		pipe.graphics
			.beginLinearGradientFill(["#F03E8A","#fff"], [0, 1], 20, 0, 70, 0)
			.drawRect(0, 0, pipeWidth, pipeHeight);

		pipe.x = w;
		pipe.y = h -  pipeHeight - groundImg.height;
		pipe.width = pipeWidth;
		pipe.height = pipeHeight;

		pipe2.graphics
			.beginLinearGradientFill(["#F03E8A","#fff"], [0, 1], 20, 0, 70, 0)
			.drawRect(0, 0, pipeWidth, pipe2Height);

		pipe2.x = w;
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

	function handleJumpStart(e) {
		if(finished){
			return;
		}
		appStarted = true;


		if(!pipeInterval){
			pipeInterval = setInterval(buildPipe, 1500);
		}

		//grant.gotoAndPlay("jump");

		bird.gotoAndPlay("fly");

		birdJumpedTimeout && clearTimeout( birdJumpedTimeout );
		birdGoDownTimeout && clearTimeout( birdGoDownTimeout );

		birdJumped = true;
		birdGoDown = false;
		
		birdJumpedTimeout = setTimeout(function(){
			birdJumped = false;
			birdGoDown = true;

			birdGoDownTimeout = setTimeout(function(){
				birdGoDown = false;
				bird.gotoAndPlay("fall");
			}, 300);
		}, 300);

	}


	function addPoint(){
		point += 1;
		console.log(point);
	}

	function gameover(){
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
	}

	function tick(event) {

		var deltaS = event.delta / 1000;
		var speed = 150;

		// this flag is only on when the bird has been crashed and needs to die. we move the bird all the way down and kill it.

		if(killBird){
			if(bird.y <=  ground.y - 30){

				bird.y = bird.y + 400 * deltaS;
				
			}else{
				killBird = false;
				bird.gotoAndPlay("dead");
			}

		}

		if(appStarted && !finished){

			

			//var gPosition = grant.x + 150 * deltaS;
	
			//var grantW = grant.getBounds().width * grant.scaleX;

			//grant.x = (gPosition >= w) ? -grantW : gPosition;
			
			if(birdGoDown){

				bird.y = bird.y + 3;
			
			}else if(birdJumped){
				//avoiding the bird to go off the screen
				if(bird.y <= 0){
					bird.y = 0;
				}else{
					bird.y = bird.y - 2;
				}

			}else if(bird.y <=  ground.y - 30){

				bird.y = bird.y + 400 * deltaS;
				
			}else{
				gameover();
			}
		
			ground.x = (ground.x - deltaS * speed) % (ground.tileWidth * 12);
			
			pipes.every(function(pipe, index){
				var pipeTop = pipe.top;
				var pipeBottom = pipe.bottom;



				// if bird is within pipe
				if( bird.x + bird.width >= pipeTop.x && bird.x <= pipeTop.x + pipeTop.width){

					// if bird crashes with pipe game over;
					if(bird.y  <= pipeTop.y + pipeTop.height ||  bird.y + bird.height >= pipeBottom.y){
					

						gameover();
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
						addPoint();
					
				}

				// remove the pipe when it is off the screen;
				if(pipeTop.x < -1* pipeTop.width){
					pipes.splice(index, 1);
				}

				// animate pipe.
				pipeTop.x = pipeTop.x - deltaS * speed;
				pipeBottom.x = pipeBottom.x - deltaS * speed;
				return true;
				
			});

			// ainmate cloud
			cloud.x = (cloud.x - deltaS * 10) % w;

			//if clould is off the screen bring it back from the right side
			if(cloud.x <=0){
				cloud.x = w;
			}

			hill.x = (hill.x - deltaS * 20) % hill.tileWidth;
		
		}

		stage.update(event);
		
	}

