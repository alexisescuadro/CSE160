// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;

  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;

    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);

    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);

    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV); 

    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV); 

    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV); 

    } else {
      gl_FragColor = vec4(1,.2,.2,1);
    }

  }
`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_whichTexture;
var g_camera = new Camera();
let g_keys = {};
var vertexBuffer = null;
var uvBuffer = null;
var g_blockMap = [];
let g_score = 0;
let g_petals = [];
let g_gameTime = 60; 
let g_gameStartTime = 0;
let g_gameActive = false;

let g_rainbowHue = 0;
let g_isRainbow = false;
let g_fleftAngle1 = 0; // front left leg
let g_fleftAngle2 = 0; // front left joint
let g_frightAngle1 = 0; // front right leg
let g_frightAngle2 = 0; // front right joint
let g_bleftAngle1 = 0; // back left leg
let g_bleftAngle2 = 0; // back left joint
let g_brightAngle1 = 0; // back right leg
let g_brightAngle2 = 0; // back right joint
let r_hoof_angle = 0; // right hoof joint
let l_hoof_angle = 0; // left hoof joint
let g_neckAngle = 0;
let g_lastMouseX = 0;
let g_lastMouseY = 0;
let g_mouseDown = false;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let g_animation = false;
let g_animation_starttime= 0;

function drawCone(segment_count) {
  let angle_help = 360 / segment_count;

  for (let angle = 0; angle < 360; angle += angle_help) {
    let angle1 = angle * Math.PI / 180;
    let angle2 = (angle + angle_help) * Math.PI / 180;

    let x1 = Math.cos(angle1) * 0.5;
    let z1 = Math.sin(angle1) * 0.5;
    let x2 = Math.cos(angle2) * 0.5;
    let z2 = Math.sin(angle2) * 0.5;

    // draw bottom
    drawTriangle3D([0.5,0,0.5, x2+0.5, 0, z2+0.5, x1+0.5,0,z1+0.5]);

    // draw side
    drawTriangle3D([x1+0.5, 0, z1+0.5,  x2+0.5, 0, z2+0.5,  0.5, 1, 0.5]);
  }
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
   if (!canvas) {
    console.log('Failed to get canvas element');
    return false;
  }

  let contextAttributes = { 
    preserveDrawingBuffer: true,
    alpha: false,
    depth: true,
    antialias: true
  };
  
  gl = canvas.getContext("webgl2", contextAttributes) || 
       canvas.getContext("webgl", contextAttributes) || 
       canvas.getContext("experimental-webgl", contextAttributes);
  

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canvas.width, canvas.height);

  vertexBuffer = gl.createBuffer();
  uvBuffer = gl.createBuffer();
  
  if (!vertexBuffer || !uvBuffer) {
    console.log('Failed to create buffer objects');
    return false;
  }

  return true;
}

function connectVariablestoGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }


  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return; 
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return; 
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return; 
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if(!u_Sampler0) {
    console.log("Failed to get the storage location of u_Sampler0");
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if(!u_Sampler1) {
    console.log("Failed to get the storage location of u_Sampler1");
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if(!u_Sampler2) {
    console.log("Failed to get the storage location of u_Sampler2");
    return false;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if(!u_Sampler3) {
    console.log("Failed to get the storage location of u_Sampler3");
    return false;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }


  // Set an intial value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_globalAngle = 0;
let g_yellowAnimation = false;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI() {

  // Button Events (Shape Type)
  document.getElementById('animationOnButton').onclick = function() {g_yellowAnimation=true;};
  document.getElementById('animationOffButton').onclick = function() {g_yellowAnimation=false;};

  //document.getElementById("pointButton").onclick = function() {g_selectedType=POINT};
  //document.getElementById("triButton").onclick = function() {g_selectedType=TRIANGLE};
  //document.getElementById("circleButton").onclick = function() {g_selectedType=CIRCLE};
 
  // Slider Events
  document.getElementById("blueSlide").addEventListener("mousemove", function() { g_bleftAngle1 = this.value; renderScene(); });
  document.getElementById("redSlide").addEventListener("mousemove", function() { g_frightAngle1 = this.value; renderScene(); });
  document.getElementById("greenSlide").addEventListener("mousemove", function() { g_brightAngle1= this.value; renderScene(); });
  document.getElementById("yellowSlide").addEventListener("mousemove", function() {g_fleftAngle1 = this.value; renderScene(); });
  document.getElementById("yellowSlide2").addEventListener("mousemove", function() { g_fleftAngle2 = this.value; renderScene(); });

  // Size Slider Events
  //document.getElementById("sizeSlide").addEventListener("mouseup", function() {g_selectedSize = this.value; });

  // Draw flower!
  //document.getElementById("drawFlower").onclick = function() {generateFlower(); };

  // Rainbow Brush!
  //document.getElementById("rainbowButton").onclick = function() {g_isRainbow = !g_isRainbow; };

  // Angle slider
  document.getElementById("angleSlide").addEventListener("mousemove", function() { g_globalAngle = this.value; renderScene(); });
}

function initTextures() {
  var image0 = new Image();
  if (!image0) {
    console.log("Failed to create the image object");
    return false;
  }
  image0.onload = function(){sendImageToTEXTURE(image0, 0);}
  image0.src = 'cherry_planks.jpg';

  var image1 = new Image();
  image1.onload = function(){sendImageToTEXTURE(image1, 1);}
  image1.src = 'sunset.jpg';

  var image2 = new Image();
  image2.onload = function(){sendImageToTEXTURE(image2, 2);}
  image2.src = 'cherry_blossom.jpg';

  var image3 = new Image();
  image3.onload = function(){sendImageToTEXTURE(image3, 3);}
  image3.src = 'tree_bark.jpg';

  return true;
}

function sendImageToTEXTURE(image, texNum) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0 + texNum);

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  if (texNum == 0) gl.uniform1i(u_Sampler0, 0);
  if (texNum == 1) gl.uniform1i(u_Sampler1, 1);
  if (texNum == 2) gl.uniform1i(u_Sampler2, 2);
  if (texNum == 3) gl.uniform1i(u_Sampler3, 3);

  console.log('finished loadTexture');
}

function initBlockMap() {
  g_blockMap = [];
  for (let x = 0; x < 32; x++) {
    g_blockMap[x] = [];
    for (let z = 0; z < 32; z++) {
      g_blockMap[x][z] = [];
    }
  }
}

function placeBlock() {
  let camX = g_camera.eye.elements[0];
  let camZ = g_camera.eye.elements[2];
  
  let forward = g_camera.at.subtract(g_camera.eye);
  forward = forward.divide(forward.length());
  
  let targetX = camX + forward.elements[0] * 2;
  let targetZ = camZ + forward.elements[2] * 2;
  
  let mapX = Math.floor(targetX + 16);
  let mapZ = Math.floor(targetZ + 16);
  
  if (mapX >= 0 && mapX < 32 && mapZ >= 0 && mapZ < 32) {
    let height = 0;
    while (g_blockMap[mapX][mapZ][height]) {
      height++;
    }

    if (height < 10) {
      g_blockMap[mapX][mapZ][height] = 1;
      console.log(`Placed block at (${mapX}, ${height}, ${mapZ})`);
    }
  }
}

function removeBlock() {
  
  let camX = g_camera.eye.elements[0];
  let camZ = g_camera.eye.elements[2];
  
  let forward = g_camera.at.subtract(g_camera.eye);
  forward = forward.divide(forward.length());
  
  let targetX = camX + forward.elements[0] * 2;
  let targetZ = camZ + forward.elements[2] * 2;
  
  let mapX = Math.floor(targetX + 16);
  let mapZ = Math.floor(targetZ + 16);
  
  if (mapX >= 0 && mapX < 32 && mapZ >= 0 && mapZ < 32) {
    let height = 0;
    while (g_blockMap[mapX][mapZ][height]) {
      height++;
    }
    
    if (height > 0) {
      g_blockMap[mapX][mapZ][height - 1] = 0;
      console.log(`Removed block at (${mapX}, ${height - 1}, ${mapZ})`);
    }
  }
}

// create a tree
function generateTree(x, z, trunkHeight) {
  trunkHeight = trunkHeight || 4;
  
  let groundLevel = 0;
  if (g_blockMap[x] && g_blockMap[x][z]) {
    while (g_blockMap[x][z][groundLevel]) {
      groundLevel++;
    }
  }
  
  // create the trunk
  for (let h = 0; h < trunkHeight; h++) {
    if (!g_blockMap[x]) g_blockMap[x] = [];
    if (!g_blockMap[x][z]) g_blockMap[x][z] = [];
    g_blockMap[x][z][groundLevel + h] = 2; 
  }
  
  // create leaves
  let leafStart = groundLevel + trunkHeight;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = 0; dy < 3; dy++) {
        let leafX = x + dx;
        let leafZ = z + dz;
        let leafY = leafStart + dy;
        
        if (dx === 0 && dz === 0 && dy < 2) continue;
        
        if (leafX >= 0 && leafX < 32 && leafZ >= 0 && leafZ < 32) {
          if (!g_blockMap[leafX]) g_blockMap[leafX] = [];
          if (!g_blockMap[leafX][leafZ]) g_blockMap[leafX][leafZ] = [];
          g_blockMap[leafX][leafZ][leafY] = 3; 
        }
      }
    }
  }
}

// add random trees to map
function spawnTrees(numTrees) {
  for (let i = 0; i < numTrees; i++) {
    let x = Math.floor(Math.random() * 28) + 2;
    let z = Math.floor(Math.random() * 28) + 2;
    let height = Math.floor(Math.random() * 4) + 3;
    
    generateTree(x, z, height);
  }
}

function startGame() {
  g_gameActive = true;
  g_gameStartTime = g_seconds;
  g_score = 0;
  g_petals = [];
  console.log("Go! Collect falling cherry blossoms!");
  console.log("Walk into the falling petals to collect them.");
}

function spawnPetal() {
  if (g_petals.length < 20) { 
    g_petals.push(new Petal());
  }
}

function checkPetalCollection() {
  let camX = g_camera.eye.elements[0];
  let camY = g_camera.eye.elements[1];
  let camZ = g_camera.eye.elements[2];
  
  for (let i = g_petals.length - 1; i >= 0; i--) {
    let petal = g_petals[i];
    let dx = petal.x - camX;
    let dy = petal.y - camY;
    let dz = petal.z - camZ;
    let distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    if (distance < 1.5) { 
      g_score++;
      g_petals.splice(i, 1);
      console.log("Collected! Score: " + g_score);
    }
  }
}


function main() {


  // Set up canvas and gl variables
  setupWebGL();

  // Set up GLSL shader programs and connect GLSL variables
  connectVariablestoGLSL();

  initBlockMap();
  spawnTrees(20);

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  //document.onkeydown = keydown;
  document.onkeydown = function(ev) { g_keys[ev.keyCode] = true; };
  document.onkeyup   = function(ev) { g_keys[ev.keyCode] = false; };

  initTextures();

  

  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_animation = true;
      g_animation_starttime = g_seconds;
      return;
    }

    //let [x, y] = convertCoordinatesEventtoGL(ev);
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    g_mouseDown = true;
  };

  canvas.onmousemove = function(ev) {
    if (g_mouseDown) {
  
    let deltaX = ev.clientX - g_lastMouseX;
    let deltaY = ev.clientY - g_lastMouseY;

    let sensitivity = 0.5;
    
    let rotationAmount = deltaX * sensitivity;
    
    if (rotationAmount > 0) {
      for (let i = 0; i < Math.abs(rotationAmount); i++) {
        g_camera.rotateRight();
      }
    } else if (rotationAmount < 0) {
      for (let i = 0; i < Math.abs(rotationAmount); i++) {
        g_camera.rotateLeft();
      }
    }

    let rotationY = deltaY * sensitivity;

    if (rotationY > 0) {
      for (let i = 0; i < Math.abs(rotationY); i++) {
        g_camera.rotateDown();
      }
    } else if (rotationY < 0) {
      for (let i = 0; i < Math.abs(rotationY); i++) {
        g_camera.rotateUp();
      }
    }

    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    renderScene();
  }
  };
  
  canvas.onmouseup = function() {
    g_mouseDown = false;
  };

  canvas.onmouseleave = function() {
    g_mouseDown = false;
  };

  gl.clearColor(0.05, 0.09, 0.46, 0.8);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderScene();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;

  processKeys();
  updateAnimationAngles();

  // cherry blossom game
  if (g_gameActive) {
    let timeLeft = g_gameTime - (g_seconds - g_gameStartTime);
    
    if (timeLeft > 0) {
      if (Math.random() < 0.15) {
        spawnPetal();
      }
      
      for (let i = g_petals.length - 1; i >= 0; i--) {
        if (!g_petals[i].update()) {
          g_petals.splice(i, 1); 
        }
      }
      
      document.getElementById('gameInfo').innerHTML = 
        `<br>Score: ${g_score} | Time: ${Math.ceil(timeLeft)}`;
    } else {
      g_gameActive = false;
      document.getElementById('gameInfo').innerHTML = 
        `<br>Game Over! Final Score: ${g_score} | Press G to play again`;
    }
  } else {
    document.getElementById('gameInfo').innerHTML = 
      `<br>Press G to start collecting cherry blossoms! Walk around the world and touch the petals to collect them.`;
  }

  renderScene();

  frameCount++;
  let currentTime = performance.now();
  if (currentTime - lastFpsUpdate >= 1000) {
    document.getElementById('fps').textContent = frameCount;
    frameCount = 0;
    lastFpsUpdate = currentTime;
  }
  
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_yellowAnimation) {
    g_fleftAngle1 = (30*Math.sin(g_seconds) + 1) ;
    g_fleftAngle2 = (10*Math.sin(g_seconds) - 10);

    g_frightAngle1 = (-30*Math.sin(g_seconds) + 1);
    g_frightAngle2 = (-10*Math.sin(g_seconds) - 10);

    g_bleftAngle1 = (30*Math.sin(g_seconds) + 1) ;
    g_bleftAngle2 = (10*Math.sin(g_seconds) - 10);

    g_brightAngle1 = (-30*Math.sin(g_seconds) + 1);
    g_brightAngle2 = (-10*Math.sin(g_seconds) - 10);

    g_neckAngle = (15*Math.sin(g_seconds) - 15);
    r_hoof_angle = (-10*Math.sin(g_seconds));
    l_hoof_angle = (10*Math.sin(g_seconds));
  }

  if (g_animation) {
    let timePassed = g_seconds - g_animation_starttime;
    let duration = 3.0;

    if (timePassed < duration) {
      let progress = timePassed / duration;
      g_neckAngle = -60 * Math.sin(progress * Math.PI);
      
      g_fleftAngle1 = 80 * Math.sin(progress * Math.PI);
      g_fleftAngle2 = 0 * Math.sin(progress * Math.PI);

      g_frightAngle1 = 80 * Math.sin(progress * Math.PI);
      g_frightAngle2 = 0 * Math.sin(progress * Math.PI);

      g_bleftAngle1 = -80 * Math.sin(progress * Math.PI);
      g_bleftAngle2 = 0 * Math.sin(progress * Math.PI);

      g_brightAngle1 = -80 * Math.sin(progress * Math.PI);
      g_brightAngle2 = 0 * Math.sin(progress * Math.PI);

      r_hoof_angle = 0 * Math.sin(progress * Math.PI);
      l_hoof_angle = 0 * Math.sin(progress * Math.PI);

    } else {
      g_animation = false;
      g_neckAngle = 0;
      g_fleftAngle1 = 0;
      g_fleftAngle2 = 0;

      g_frightAngle1 = 0;
      g_frightAngle2 = 0;

      g_bleftAngle1 = 0
      g_bleftAngle2 = 0;

      g_brightAngle1 = 0;
      g_brightAngle2 = 0;
      r_hoof_angle = 0;
      l_hoof_angle = 0;
    }
  }
}

var g_shapesList = [];

//var g_points = [];  
//var g_colors = [];  
//var g_sizes = [];

function click(ev) {

  [x,y] = convertCoordinatesEventtoGL(ev);

  let point;
  if (g_selectedType==POINT) {
    point = new Point();
  } else if (g_selectedType==TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }

  point.position=[x,y];
  //point.color=g_selectedColor.slice();

  if (g_isRainbow) { // if rainbow brush pressed, turn on
    g_rainbowHue = (g_rainbowHue + 2) % 360;
    let h = g_rainbowHue / 360;
    let r = Math.abs(h * 6 - 3) - 1;
    let g = 2 - Math.abs(h * 6 - 2);
    let b = 2 - Math.abs(h * 6 - 4);
    point.color = [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b)), 1.0];
  } else { // else normal brush
    point.color = g_selectedColor.slice();
  }
  
  point.size=g_selectedSize;
  g_shapesList.push(point);

  // Draw every shape that is supposed to be in the canvas
  renderScene();
}

function convertCoordinatesEventtoGL(ev) {
  var x = ev.clientX; 
  var y = ev.clientY; 
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}


function processKeys() {
    if (g_keys[87]) g_camera.forward();   // W
    if (g_keys[83]) g_camera.back();      // S
    if (g_keys[65]) g_camera.left();      // A
    if (g_keys[68]) g_camera.right();     // D
    if (g_keys[81]) g_camera.rotateLeft();  // Q
    if (g_keys[69]) g_camera.rotateRight(); // E

    if (g_keys[32]) { // space
      placeBlock();
      g_keys[32] = false; 
    }
    if (g_keys[88]) { // X 
      removeBlock();
      g_keys[88] = false; 
    }

    if (g_keys[71]) {
      startGame();
      g_keys[71] = false;
    }
    
    if (g_gameActive) {
      checkPetalCollection();
    }
}

var g_map=[
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,1],
];

function drawMap() {
  // create pathways in the map
  var pathways = [
    {x: 5, y: 5, width: 10, height: 1},
    {x: 15, y: 10, width: 8, height: 1},
    {x: 8, y: 20, width: 12, height: 1},
    {x: 10, y: 5, width: 1, height: 10},
    {x: 20, y: 12, width: 1, height: 8},
    {x: 7, y: 7, width: 3, height: 3},
    {x: 22, y: 22, width: 4, height: 4},
  ];
  function isPathway(x, y) {
    for (let path of pathways) {
      if (x >= path.x && x < path.x + path.width &&
          y >= path.y && y < path.y + path.height) {
        return true;
      }
    }
    return false;
  }
  
  // make the walls have a pattern
  for (x = 0; x < 32; x++) {
    for (y = 0; y < 32; y++) {
      if (x == 0 || x == 31 || y == 0 || y == 31 || isPathway(x, y)) {
        let wavePosition;
        
        if (x == 0 || x == 31 || y == 0 || y == 31) {
          if (y == 0) {
            wavePosition = x;
          } else if (x == 31) {
            wavePosition = 32 + y;
          } else if (y == 31) {
            wavePosition = 64 + (31 - x);
          } else { // x == 0
            wavePosition = 96 + (31 - y);
          }
        } else {
          wavePosition = x + y;
        }
        // make the terrain pattern
        let wallHeight = Math.floor(2 + Math.sin(wavePosition * 0.5) * 2);
        wallHeight = Math.max(2, Math.min(5, wallHeight));
        
        for (h = 0; h < wallHeight; h++) {
          var body = new Cube();
          
          body.textureNum = 2;
          body.matrix.translate(0, -.75, 0);
          body.matrix.scale(1, 1, 1);
          body.matrix.translate(x - 16, h, y - 16);
          body.renderfast();
        }
      }
    }
  }
   for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      if (g_blockMap[x] && g_blockMap[x][z]) {
        for (let y = 0; y < g_blockMap[x][z].length; y++) {
          if (g_blockMap[x][z][y]) {
            var block = new Cube();

            if (g_blockMap[x][z][y] === 1) {
            // blocks that players can place
            block.color = [0.6, 0.4, 0.2, 1]; 
            block.textureNum = 0;
          } else if (g_blockMap[x][z][y] === 2) {  
            // trunk of the tree
            block.color = [0.4, 0.3, 0.2, 1]; 
            block.textureNum = 3;
          } else if (g_blockMap[x][z][y] === 3) {  
            // cherry blossom leaves
            block.color = [1, 1, 1, 1];
            block.textureNum = 2; 
          }
          
            //block.color = [0.6, 0.4, 0.2, 1]; 
            //block.textureNum = 0; 
            block.matrix.translate(0, -.75, 0);
            block.matrix.scale(1, 1, 1);
            block.matrix.translate(x - 16, y, z - 16);
            block.renderfast();
          }
        }
      }
    }
  }
}


function renderScene() {

 
  var projMat = new Matrix4();
  projMat.setPerspective(50, canvas.width/canvas.height, .1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(
      g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
      g_camera.at.x, g_camera.at.y, g_camera.at.z,
      g_camera.up.x, g_camera.up.y, g_camera.up.z);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT );

  // Yellow: neck.color = [0.89, 0.66, 0.05, 0.8];
  // Brown: neck.color = [0.23, 0.11, 0.0, 0.8];

  drawMap();

  for (let petal of g_petals) {
    petal.render();
  }

  // ground
  var ground = new Cube();
  ground.color = [0.41, 0.69, 0.25, 1];
  ground.textureNum = -2;
  ground.matrix.translate(0, -.75, 0);
  ground.matrix.scale(32.0, 0, 32.0);  
  ground.matrix.translate(-0.5, 0, -0.5);
  gl.uniform4f(u_FragColor, ground.color[0], ground.color[1], ground.color[2], ground.color[3]);
  ground.render();

  // sky
  var sky = new Cube();
  sky.color = [1.0,0.0,0.0,1.0];
  sky.textureNum = 1;
  sky.matrix.scale(100,100,100);
  sky.matrix.translate(-.5,-.5,-.5);
  sky.render();
}

