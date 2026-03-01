// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec3 v_Normal;
  varying vec2 v_UV;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightDir;
  uniform float u_cutoff;
  uniform vec3 u_cameraPos;
  uniform bool u_specularOn;
  uniform bool u_lightOn;
  uniform bool u_spotlightOn;

  void main() {
    if (u_whichTexture == -3) {
      gl_FragColor = vec4((v_Normal + 1.0)/2.0, 1.0);
    } else if (u_whichTexture == -2) {
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

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
    vec3 R = reflect(-L, N);

    float nDotL = max(dot(N, L), 0.0);
    float specular = pow(max(dot(E, R), 0.0), 64.0);

    vec3 diffuse = vec3(gl_FragColor) * nDotL;
    vec3 ambient = vec3(gl_FragColor) * 0.3;

    if (u_lightOn) {
  if (u_spotlightOn) {
    // spotlight mode
    float angle = dot(L, normalize(-u_lightDir));
    if (angle < u_cutoff) {
      gl_FragColor = vec4(ambient, 1.0);
    } else {
      float intensity = (angle - u_cutoff) / (1.0 - u_cutoff);
      if (u_specularOn) {
        gl_FragColor = vec4(ambient + diffuse * intensity + vec3(specular * intensity), 1.0);
      } else {
        gl_FragColor = vec4(ambient + diffuse * intensity, 1.0);
      }
    }
  } else {
    // original point light mode
    if (u_specularOn) {
      gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
    } else {
      gl_FragColor = vec4(diffuse + ambient, 1.0);
    }
  }
}
}
`

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
var normalBuffer = null;
let a_Normal;
let g_normalOn = false;
let g_lightPos = [0, 5, -1];
let u_lightPos;
let u_specularOn;
let u_lightOn;
let u_cameraPos;
let g_lightOn = true;
let u_lightDir;
let u_cutoff;
let g_spotlightOn = false;
let u_spotlightOn;


let g_rainbowHue = 0;
let g_isRainbow = false;
let g_fleftAngle1 = 0;
let g_fleftAngle2 = 0;
let g_frightAngle1 = 0;
let g_frightAngle2 = 0;
let g_bleftAngle1 = 0;
let g_bleftAngle2 = 0;
let g_brightAngle1 = 0;
let g_brightAngle2 = 0;
let r_hoof_angle = 0;
let l_hoof_angle = 0;
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

    drawTriangle3D([0.5,0,0.5, x2+0.5, 0, z2+0.5, x1+0.5,0,z1+0.5]);
    drawTriangle3D([x1+0.5, 0, z1+0.5,  x2+0.5, 0, z2+0.5,  0.5, 1, 0.5]);
  }
}

function setupWebGL() {
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
  normalBuffer = gl.createBuffer();

  if (!normalBuffer) {
  console.log('Failed to create normal buffer');
  return false;
  }
  
  if (!vertexBuffer || !uvBuffer) {
    console.log('Failed to create buffer objects');
    return false;
  }

  return true;
}

function connectVariablestoGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return; 
  }

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

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log("Failed to get the storage loaction of u_lightPos");
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');

  u_specularOn = gl.getUniformLocation(gl.program, 'u_specularOn');

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');

  u_lightDir = gl.getUniformLocation(gl.program, 'u_lightDir');
  u_cutoff = gl.getUniformLocation(gl.program, 'u_cutoff');

  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_globalAngle = 0;
let g_yellowAnimation = false;

function addActionsForHtmlUI() {
  document.getElementById('normalOn').onclick = function() {g_normalOn = true;};
  document.getElementById('normalOff').onclick = function() {g_normalOn = false;};

  document.getElementById('animationOnButton').onclick = function() {g_yellowAnimation=true;};
  document.getElementById('animationOffButton').onclick = function() {g_yellowAnimation=false;};

  document.getElementById("blueSlide").addEventListener("mousemove", function() { g_bleftAngle1 = this.value; renderScene(); });
  document.getElementById("redSlide").addEventListener("mousemove", function() { g_frightAngle1 = this.value; renderScene(); });
  document.getElementById("greenSlide").addEventListener("mousemove", function() { g_brightAngle1= this.value; renderScene(); });
  document.getElementById("yellowSlide").addEventListener("mousemove", function() {g_fleftAngle1 = this.value; renderScene(); });
  document.getElementById("yellowSlide2").addEventListener("mousemove", function() { g_fleftAngle2 = this.value; renderScene(); });

  document.getElementById("angleSlide").addEventListener("mousemove", function() { g_globalAngle = this.value; renderScene(); });

  document.getElementById('lightOn').onclick = function() { g_lightOn = true; };
  document.getElementById('lightOff').onclick = function() { g_lightOn = false; };

  document.getElementById('spotlightOn').onclick = function() { g_spotlightOn = true; };
  document.getElementById('spotlightOff').onclick = function() { g_spotlightOn = false; };

  document.getElementById("lightSlideX").addEventListener("mousemove", function(ev) { if(ev.buttons == 1) {g_lightPos[0]= this.value/100; renderScene()}});
  document.getElementById("lightSlideY").addEventListener("mousemove", function(ev) { if(ev.buttons == 1) {g_lightPos[1]= this.value/100; renderScene()}});
  document.getElementById("lightSlideZ").addEventListener("mousemove", function(ev) { if(ev.buttons == 1) {g_lightPos[2]= this.value/100; renderScene()}});
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

function startGame() {
  g_gameActive = true;
  g_gameStartTime = g_seconds;
  g_score = 0;
  g_petals = [];
  console.log("Go! Collect falling cherry blossoms!");
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
  setupWebGL();
  connectVariablestoGLSL();
  initBlockMap();

  addActionsForHtmlUI();

  document.onkeydown = function(ev) { g_keys[ev.keyCode] = true; };
  document.onkeyup   = function(ev) { g_keys[ev.keyCode] = false; };

  initTextures();

  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_animation = true;
      g_animation_starttime = g_seconds;
      return;
    }
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
        for (let i = 0; i < Math.abs(rotationAmount); i++) g_camera.rotateRight();
      } else if (rotationAmount < 0) {
        for (let i = 0; i < Math.abs(rotationAmount); i++) g_camera.rotateLeft();
      }

      let rotationY = deltaY * sensitivity;
      if (rotationY > 0) {
        for (let i = 0; i < Math.abs(rotationY); i++) g_camera.rotateDown();
      } else if (rotationY < 0) {
        for (let i = 0; i < Math.abs(rotationY); i++) g_camera.rotateUp();
      }

      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
      renderScene();
    }
  };
  
  canvas.onmouseup = function() { g_mouseDown = false; };
  canvas.onmouseleave = function() { g_mouseDown = false; };

  gl.clearColor(0.72, 0.72, 0.72, 1.0);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;

  processKeys();
  updateAnimationAngles();

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
    g_fleftAngle1 = (30*Math.sin(g_seconds) + 1);
    g_fleftAngle2 = (10*Math.sin(g_seconds) - 10);
    g_frightAngle1 = (-30*Math.sin(g_seconds) + 1);
    g_frightAngle2 = (-10*Math.sin(g_seconds) - 10);
    g_bleftAngle1 = (30*Math.sin(g_seconds) + 1);
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
      r_hoof_angle = 0;
      l_hoof_angle = 0;
    } else {
      g_animation = false;
      g_neckAngle = 0;
      g_fleftAngle1 = 0; g_fleftAngle2 = 0;
      g_frightAngle1 = 0; g_frightAngle2 = 0;
      g_bleftAngle1 = 0; g_bleftAngle2 = 0;
      g_brightAngle1 = 0; g_brightAngle2 = 0;
      r_hoof_angle = 0; l_hoof_angle = 0;
    }
  }

  g_lightPos[0] = Math.cos(g_seconds * 0.5) * 5.5;
}

var g_shapesList = [];

function click(ev) {
  [x,y] = convertCoordinatesEventtoGL(ev);
  let point;
  if (g_selectedType==POINT) point = new Point();
  else if (g_selectedType==TRIANGLE) point = new Triangle();
  else point = new Circle();

  point.position=[x,y];
  if (g_isRainbow) {
    g_rainbowHue = (g_rainbowHue + 2) % 360;
    let h = g_rainbowHue / 360;
    let r = Math.abs(h * 6 - 3) - 1;
    let g = 2 - Math.abs(h * 6 - 2);
    let b = 2 - Math.abs(h * 6 - 4);
    point.color = [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b)), 1.0];
  } else {
    point.color = g_selectedColor.slice();
  }
  point.size=g_selectedSize;
  g_shapesList.push(point);
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
  if (g_keys[87]) g_camera.forward();
  if (g_keys[83]) g_camera.back();
  if (g_keys[65]) g_camera.left();
  if (g_keys[68]) g_camera.right();
  if (g_keys[81]) g_camera.rotateLeft();
  if (g_keys[69]) g_camera.rotateRight();

  if (g_keys[32]) {
    placeBlock();
    g_keys[32] = false;
  }
  if (g_keys[88]) {
    removeBlock();
    g_keys[88] = false;
  }
  if (g_keys[71]) {
    startGame();
    g_keys[71] = false;
  }
  
  if (g_gameActive) checkPetalCollection();
}

// Room dimensions
const ROOM_HALF = 8;  
const ROOM_HEIGHT = 8;  

function drawRoom() {

  var floor = new Cube();
  floor.color = [1.0, 1.0, 1.0, 1];
  //floor.textureNum = 1; // sunset.jpg
  if (g_normalOn) {
    floor.textureNum = -3;
  } else {
    floor.textureNum = 1; 
  }
  floor.matrix.translate(-ROOM_HALF, -0.75, -ROOM_HALF);
  floor.matrix.scale(ROOM_HALF * 2, 0.02, ROOM_HALF * 2);
  floor.render();

  var ceiling = new Cube();
  ceiling.color = [0.88, 0.88, 0.88, 1];
  //ceiling.textureNum = -2;
  if (g_normalOn) {
    ceiling.textureNum = -3;
  } else {
    ceiling.textureNum = -2; 
  }
  ceiling.matrix.translate(-ROOM_HALF, ROOM_HEIGHT - 0.75, -ROOM_HALF);
  ceiling.matrix.scale(ROOM_HALF * 2, 0.02, ROOM_HALF * 2);
  ceiling.render();

  var wallBack = new Cube();
  wallBack.color = [0.72, 0.72, 0.72, 1];
  //wallBack.textureNum = -2;
  if (g_normalOn) {
    wallBack.textureNum = -3;
  } else {
    wallBack.textureNum = -2; 
  }
  wallBack.matrix.translate(-ROOM_HALF, -0.75, -ROOM_HALF);
  wallBack.matrix.scale(ROOM_HALF * 2, ROOM_HEIGHT, 0.02);
  wallBack.render();

  var wallFront = new Cube();
  wallFront.color = [0.72, 0.72, 0.72, 1];
  //wallFront.textureNum = -2;
  if (g_normalOn) {
    wallFront.textureNum = -3;
  } else {
    wallFront.textureNum = -2; 
  }
  wallFront.matrix.translate(-ROOM_HALF, -0.75, ROOM_HALF);
  wallFront.matrix.scale(ROOM_HALF * 2, ROOM_HEIGHT, 0.02);
  wallFront.render();

  // --- Left wall ---
  var wallLeft = new Cube();
  wallLeft.color = [0.68, 0.68, 0.68, 1];
  //wallLeft.textureNum = -2;
  if (g_normalOn) {
    wallLeft.textureNum = -3;
  } else {
    wallLeft.textureNum = -2; 
  }
  wallLeft.matrix.translate(-ROOM_HALF, -0.75, -ROOM_HALF);
  wallLeft.matrix.scale(0.02, ROOM_HEIGHT, ROOM_HALF * 2);
  wallLeft.render();

  // --- Right wall ---
  var wallRight = new Cube();
  wallRight.color = [0.68, 0.68, 0.68, 1];
  //wallRight.textureNum = -2;
  if (g_normalOn) {
    wallRight.textureNum = -3;
  } else {
    wallRight.textureNum = -2; 
  }
  wallRight.matrix.translate(ROOM_HALF, -0.75, -ROOM_HALF);
  wallRight.matrix.scale(0.02, ROOM_HEIGHT, ROOM_HALF * 2);
  wallRight.render();

  // --- Player-placed blocks ---
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      if (g_blockMap[x] && g_blockMap[x][z]) {
        for (let y = 0; y < g_blockMap[x][z].length; y++) {
          if (g_blockMap[x][z][y] === 1) {
            var block = new Cube();
            block.color = [0.6, 0.4, 0.2, 1];
            block.textureNum = 0;
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

function drawCube(modelMatrix, color) {
  var c = new Cube();
  c.color = color;
  c.textureNum = -2;
  c.matrix = modelMatrix;
  c.render();
}

function drawAnimal() {
  
  // bottom most (parent)
  var neck9 = new Cube();
  neck9.color = [0.89, 0.66, 0.05, 0.8];
  neck9.matrix.translate(0, -0.05, -0.6);
  neck9.matrix.rotate(g_neckAngle, 1, 0, 0);
  neck9.matrix.scale(0.15, 0.05, 0.15);
  gl.uniform4f(u_FragColor, neck9.color[0], neck9.color[1], neck9.color[2], neck9.color[3]);
  drawCube(neck9.matrix, neck9.color);

  // top most
  var neck0 = new Cube();
  neck0.color = [0.89, 0.66, 0.05, 0.8];
  neck0.matrix = new Matrix4(neck9.matrix);
  //neck.matrix.translate(0, 0.25, -0.525);
  neck0.matrix.translate(0, 6, 0.5);
  //neck.matrix.rotate(0, 1, 0, 0);
  neck0.matrix.scale(1/0.15,1/0.05,1/0.15);
  neck0.matrix.scale(0.15, 0.05, 0.075);
  gl.uniform4f(u_FragColor, neck0.color[0], neck0.color[1], neck0.color[2], neck0.color[3]);
  drawCube(neck0.matrix, neck0.color);

  var neck1 = new Cube();
  neck1.color = [0.23, 0.11, 0.0, 0.8];
  neck1.matrix = new Matrix4(neck9.matrix);
  neck1.matrix.translate(0, 6, 0);
  //neck1.matrix.translate(0, 0.25, -0.6);
  //neck1.matrix.rotate(0, 1, 0, 0);
  neck1.matrix.scale(1/0.15,1/0.05,1/0.15);
  neck1.matrix.scale(0.15, 0.05, 0.075);
  gl.uniform4f(u_FragColor, neck1.color[0], neck1.color[1], neck1.color[2], neck1.color[3]);
  drawCube(neck1.matrix, neck1.color);

  var neck2 = new Cube();
  neck2.color = [0.89, 0.66, 0.05, 0.8];
  neck2.matrix = new Matrix4(neck9.matrix);
  //neck2.matrix.translate(0, 0.2, -0.6);
  neck2.matrix.translate(0,5,0);
  //neck2.matrix.rotate(0, 1, 0, 0);
  neck2.matrix.scale(1/0.15,1/0.05,1/0.15);
  neck2.matrix.scale(0.15, 0.05, 0.15);
  gl.uniform4f(u_FragColor, neck2.color[0], neck2.color[1], neck2.color[2], neck2.color[3]);
  drawCube(neck2.matrix, neck2.color);
  
  var neck3 = new Cube();
  neck3.color = [0.89, 0.66, 0.05, 0.8];
  neck3.matrix = new Matrix4(neck9.matrix);
  //neck3.matrix.translate(0.0, 0.15, -0.6);
  neck3.matrix.translate(0, 4, 0);
  //neck3.matrix.rotate(0, 1, 0, 0);
  neck3.matrix.scale(1/0.15,1/0.05,1/0.15);
  neck3.matrix.scale(0.075, 0.05, 0.15);
  gl.uniform4f(u_FragColor, neck3.color[0], neck3.color[1], neck3.color[2], neck3.color[3]);
  drawCube(neck3.matrix, neck3.color);

  var neck4 = new Cube();
  neck4.color = [0.23, 0.11, 0.0, 0.8];
  neck4.matrix = new Matrix4(neck9.matrix);
  //neck4.matrix.translate(0.075, 0.15, -0.6);
  neck4.matrix.translate(0.5, 4, 0);
  neck4.matrix.scale(1/0.15, 1/0.05, 1/0.15);
  //neck4.matrix.rotate(0, 1, 0, 0);
  neck4.matrix.scale(0.075, 0.05, 0.15);
  gl.uniform4f(u_FragColor, neck4.color[0], neck4.color[1], neck4.color[2], neck4.color[3]);
  drawCube(neck4.matrix, neck4.color);

  var neck5 = new Cube();
  neck5.color = [0.23, 0.11, 0.0, 0.8];
  neck5.matrix = new Matrix4(neck9.matrix);
  //neck5.matrix.translate(0, 0.10, -0.525);
  neck5.matrix.translate(0, 3, 0.5);
  neck5.matrix.scale(1/0.15,1/0.05,1/0.15);
  //neck5.matrix.rotate(0, 1, 0, 0);
  neck5.matrix.scale(0.15, 0.05, 0.075);
  gl.uniform4f(u_FragColor, neck5.color[0], neck5.color[1], neck5.color[2], neck5.color[3]);
  drawCube(neck5.matrix, neck5.color);

  var neck6 = new Cube();
  neck6.color = [0.89, 0.66, 0.05, 0.8];
  neck6.matrix = new Matrix4(neck9.matrix);
  neck6.matrix.translate(0,3,0);
  neck6.matrix.scale(1/0.15, 1/0.05, 1/0.15);
  //neck6.matrix.translate(0, 0.10, -0.6);
  //neck6.matrix.rotate(0, 1, 0, 0);
  neck6.matrix.scale(0.15, 0.05, 0.075);
  //neck6.matrix.scale(0,0,0);
  gl.uniform4f(u_FragColor, neck6.color[0], neck6.color[1], neck6.color[2], neck6.color[3]);
  drawCube(neck6.matrix, neck6.color);

  var neck7 = new Cube();
  neck7.color = [0.23, 0.11, 0.0, 0.8];
  neck7.matrix = neck9.matrix;
  neck7.matrix.translate(0, 1, 0);
  //neck7.matrix.rotate(0, 1, 0, 0);
  //neck7.matrix.scale(0.15, 0.05, 0.15);
  gl.uniform4f(u_FragColor, neck7.color[0], neck7.color[1], neck7.color[2], neck7.color[3]);
  drawCube(neck7.matrix, neck7.color);

  var neck8 = new Cube();
  neck8.color = [0.89, 0.66, 0.05, 0.8];
  neck8.matrix = neck9.matrix;
  neck8.matrix.translate(0, 1, 0);
  //neck8.matrix.rotate(0, 1, 0, 0);
  //neck8.matrix.scale(0.15, 0.05, 0.15);
  gl.uniform4f(u_FragColor, neck8.color[0], neck8.color[1], neck8.color[2], neck8.color[3]);
  drawCube(neck8.matrix, neck8.color);


  // Create Body
  var body1 = new Cube();
  body1.color = [0.89, 0.66, 0.05, 0.8];
  body1.matrix.translate(0, -0.05, -0.6);
  body1.matrix.rotate(0, 1, 0, 0);
  body1.matrix.scale(0.15, 0.05, 0.3);
  gl.uniform4f(u_FragColor, body1.color[0], body1.color[1], body1.color[2], body1.color[3]);
  drawCube(body1.matrix, body1.color);

  var body2 = new Cube();
  body2.color = [0.23, 0.11, 0.0, 0.8];
  body2.matrix.translate(0, -0.05, -0.3);
  body2.matrix.rotate(0, 1, 0, 0);
  body2.matrix.scale(0.15, 0.05, 0.075);
  gl.uniform4f(u_FragColor, body2.color[0], body2.color[1], body2.color[2], body2.color[3]);
  drawCube(body2.matrix, body2.color);

  var body3 = new Cube();
  body3.color = [0.89, 0.66, 0.05, 0.8];
  body3.matrix.translate(-0.075, -0.10, -0.6);
  body3.matrix.rotate(0, 1, 0, 0);
  body3.matrix.scale(0.3, 0.05, 0.15);
  gl.uniform4f(u_FragColor, body3.color[0], body3.color[1], body3.color[2], body3.color[3]);
  drawCube(body3.matrix, body3.color);

  var body4 = new Cube();
  body4.color = [0.89, 0.66, 0.05, 0.8];
  body4.matrix.translate(-0.075, -0.10, -0.375);
  body4.matrix.rotate(0, 1, 0, 0);
  body4.matrix.scale(0.3, 0.05, 0.15);
  gl.uniform4f(u_FragColor, body4.color[0], body4.color[1], body4.color[2], body4.color[3]);
  drawCube(body4.matrix, body4.color);

  // Create head

  // top most
  var head = new Cube();
  head.color = [0, 0, 0, 1];
  head.matrix = new Matrix4(neck0.matrix);
  //head.matrix.translate(0, 0.45, -0.525);
  head.matrix.translate(0, 4, 0);
  //head.matrix.rotate(0, 1, 0, 0);
  head.matrix.scale(1/0.15, 1/0.05, 1/0.075);
  head.matrix.scale(0.15, 0.05, 0.075);
  gl.uniform4f(u_FragColor, head.color[0], head.color[1], head.color[2], head.color[3]);
  drawCube(head.matrix, head.color);
  
  var head1 = new Cube();
  head1.color = [0.89, 0.66, 0.05, 0.8];
  head1.matrix = new Matrix4(neck0.matrix);
  //head1.matrix.translate(0, 0.4, -0.6);
  head1.matrix.translate(0, 3, -1);
  //head1.matrix.rotate(0, 1, 0, 0);
  head1.matrix.scale(1/0.15, 1/0.05, 1/0.075);
  head1.matrix.scale(0.15, 0.05, 0.15);
  gl.uniform4f(u_FragColor,  head1.color[0], head1.color[1], head1.color[2], head1.color[3]);
  drawCube(head1.matrix, head1.color);

  // eyes
  var eye1 = new Cube();
  eye1.color = [0, 0, 0.0, 1];
  eye1.matrix = new Matrix4(neck0.matrix);
  //eye1.matrix.translate(0, 0.35, -0.6);
  eye1.matrix.translate(0, 2, -1);
  eye1.matrix.scale(1/0.15, 1/0.05, 1/0.075);
  //eye1.matrix.rotate(0, 1, 0, 0);
  eye1.matrix.scale(0.15, 0.05, 0.075);
  gl.uniform4f(u_FragColor, eye1.color[0], eye1.color[1], eye1.color[2], eye1.color[3]);
  drawCube(eye1.matrix, eye1.color);


  var head2 = new Cube();
  head2.color = [0.89, 0.66, 0.05, 0.8];
  head2.matrix = new Matrix4(neck0.matrix);
  head2.matrix.translate(0,2,0);
  //head2.matrix.translate(0, 0.35, -0.525);
  //head2.matrix.rotate(0, 1, 0, 0);
  head2.matrix.scale(1/0.15,1/0.05,1/0.15);
  head2.matrix.scale(0.15, 0.05, 0.15);
  gl.uniform4f(u_FragColor, head2.color[0], head2.color[1], head2.color[2], head2.color[3]);
  drawCube(head2.matrix, head2.color);
  

  var head3 = new Cube();
  head3.color = [0.89, 0.66, 0.05, 0.8];
  head3.matrix = new Matrix4(neck0.matrix);
  head3.matrix.translate(0, 2, -3);
  //head3.matrix.translate(0, 0.35, -0.75);
  //head3.matrix.rotate(0, 1, 0, 0);
  head3.matrix.scale(1/0.15,1/0.05,1/0.15);
  head3.matrix.scale(0.15, 0.05, 0.3);
  gl.uniform4f(u_FragColor, head3.color[0], head3.color[1], head3.color[2], head3.color[3]);
  drawCube(head3.matrix, head3.color);

  // bottom most
  var head4 = new Cube();
  head4.color = [0.89, 0.66, 0.05, 0.8];
  head4.matrix = new Matrix4(neck0.matrix);  
  head4.matrix.translate(0, 1, -3);
  head4.matrix.scale(1/0.15, 1/0.05, 1/0.075);  
  head4.matrix.scale(0.15, 0.05, 0.3);
  gl.uniform4f(u_FragColor, head4.color[0], head4.color[1], head4.color[2], head4.color[3]);
  drawCube(head4.matrix, head4.color);

  // Create legs

  // front left leg (moveable)
  var fleft1 = new Cube();
  fleft1.color = [0.23, 0.11, 0.0, 0.8];
  fleft1.matrix.translate(-0.075, -0.15, -0.6);
  fleft1.matrix.rotate(g_fleftAngle1, 1, 0, 0);
  fleft1.matrix.rotate(0, 1, 0, 0);
  fleft1.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fleft1.color[0], fleft1.color[1], fleft1.color[2], fleft1.color[3]);
  drawCube(fleft1.matrix, fleft1.color);

  var left = new Cube();
  left.color = [0.89, 0.66, 0.05, 0.8];
  left.matrix = fleft1.matrix;
  fleft1.matrix.translate(0, 1, 0);
  //left2.matrix.rotate(0, 1, 0, 0);
  //left2.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, left.color[0], left.color[1], left.color[2], left.color[3]);
  drawCube(left.matrix, left.color);

  var fleft2 = new Cube();
  fleft2.color = [0.89, 0.66, 0.05, 0.8];
  fleft2.matrix = fleft1.matrix;
  fleft2.matrix.translate(0, -2, 0);
  //fleft2.matrix.rotate(g_fleftAngle2, 1, 0, 0);
  gl.uniform4f(u_FragColor, fleft2.color[0], fleft2.color[1], fleft2.color[2], fleft2.color[3]);
  drawCube(fleft2.matrix, fleft2.color);

  var fleft3 = new Cube();
  fleft3.color = [0.89, 0.66, 0.05, 0.8];
  fleft3.matrix = new Matrix4(fleft1.matrix);
  fleft3.matrix.translate(0, 0, 0);
  fleft3.matrix.rotate(g_fleftAngle2, 1, 0, 0);
  //left3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fleft3.color[0], fleft3.color[1], fleft3.color[2], fleft3.color[3]);
  drawCube(fleft3.matrix, fleft3.color);

  var fleft4 = new Cube();
  fleft4.color = [0.89, 0.66, 0.05, 0.8];
  fleft4.matrix = fleft3.matrix;
  fleft4.matrix.translate(0, -1, 0);
  //fleft4.matrix.rotate(g_fleftAngle2, 1, 0, 0);
  //left3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fleft4.color[0], fleft4.color[1], fleft4.color[2], fleft4.color[3]);
  drawCube(fleft4.matrix, fleft4.color);

  // joint 2
  var fleft6 = new Cube();
  fleft6.color = [0.23, 0.11, 0.0, 0.8];
  fleft6.matrix = new Matrix4(fleft3.matrix);
  fleft6.matrix.rotate(l_hoof_angle, 1, 0, 0);
  fleft6.matrix.translate(0, -1, 0);
  gl.uniform4f(u_FragColor, fleft6.color[0], fleft6.color[1], fleft6.color[2], fleft6.color[3]);
  drawCube(fleft6.matrix, fleft6.color);

  var fleft5 = new Cube();
  fleft5.color = [0.23, 0.11, 0.0, 0.8];
  fleft5.matrix = fleft6.matrix;
  fleft5.matrix.translate(0, -1, 0);
  gl.uniform4f(u_FragColor, fleft5.color[0], fleft5.color[1], fleft5.color[2], fleft5.color[3]);
  drawCube(fleft5.matrix, fleft5.color);


  // front right leg
  var fright = new Cube();
  fright.color = [0.89, 0.66, 0.05, 0.8];
  fright.matrix.translate(0.15, -0.10, -0.6);
  fright.matrix.rotate(g_frightAngle1, 1, 0, 0);
  fright.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fright.color[0], fright.color[1], fright.color[2], fright.color[3]);
  drawCube(fright.matrix, fright.color);

  var fright1 = new Cube();
  fright1.color = [0.23, 0.11, 0.0, 0.8];
  fright1.matrix = fright.matrix;
  fright1.matrix.translate(0, -1, 0);
  //fright1.matrix.rotate(0, 1, 0, 0);
  //fright1.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fright1.color[0], fright1.color[1], fright1.color[2], fright1.color[3]);
  drawCube(fright1.matrix, fright1.color);

  var fright2 = new Cube();
  fright2.color = [0.89, 0.66, 0.05, 0.8];
  fright2.matrix = fright.matrix;
  fright2.matrix.translate(0, -1, 0);
  //neck.matrix.rotate(0, 1, 0, 0);
  //neck.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fright2.color[0], fright2.color[1], fright2.color[2], fright2.color[3]);
  drawCube(fright2.matrix, fright2.color);

  // joint
  var fright3 = new Cube();
  fright3.color = [0.89, 0.66, 0.05, 0.8];
  fright3.matrix = new Matrix4(fright.matrix);
  fright3.matrix.translate(0, 0, 0);
  fright3.matrix.rotate(g_frightAngle2, 1, 0, 0);
  //fright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fright3.color[0], fright3.color[1], fright3.color[2], fright3.color[3]);
  drawCube(fright3.matrix, fright3.color);

  var fright4 = new Cube();
  fright4.color = [0.89, 0.66, 0.05, 0.8];
  fright4.matrix = fright3.matrix;
  fright4.matrix.translate(0, -1, 0);
  //fright4.matrix.rotate(g_frightAngle2, 1, 0, 0);
  //fright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fright4.color[0], fright4.color[1], fright4.color[2], fright4.color[3]);
  drawCube(fright4.matrix, fright4.color);

  // joint 2
  var fright6 = new Cube();
  fright6.color = [0.23, 0.11, 0.0, 0.8];
  fright6.matrix = new Matrix4(fright3.matrix);
  fright6.matrix.translate(0, -1, 0);
  fright6.matrix.rotate(r_hoof_angle, 1, 0, 0);
  //fright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fright6.color[0], fright6.color[1], fright6.color[2], fright6.color[3]);
  drawCube(fright6.matrix, fright6.color);

  var fright5 = new Cube();
  fright5.color = [0.23, 0.11, 0.0, 0.8];
  fright5.matrix = fright6.matrix;
  fright5.matrix.translate(0, -1, 0);
  //fright4.matrix.rotate(g_frightAngle2, 1, 0, 0);
  //fright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, fright5.color[0], fright5.color[1], fright5.color[2], fright5.color[3]);
  drawCube(fright5.matrix, fright5.color);


  // back left leg
  var bleft = new Cube();
  bleft.color = [0.89, 0.66, 0.05, 0.8];
  bleft.matrix.translate(-0.075, -0.10, -0.325);
  bleft.matrix.rotate(g_bleftAngle1, 1, 0, 0);
  bleft.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bleft.color[0], bleft.color[1], bleft.color[2], bleft.color[3]);
  drawCube(bleft.matrix, bleft.color);

  var bleft1 = new Cube();
  bleft1.color = [0.23, 0.11, 0.0, 0.8];
  bleft1.matrix = bleft.matrix;
  bleft1.matrix.translate(0, -1, 0);
  //bleft1.matrix.rotate(0, 1, 0, 0);
  //bleft1.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bleft1.color[0], bleft1.color[1], bleft1.color[2], bleft1.color[3]);
  drawCube(bleft1.matrix, bleft1.color);

  var bleft2 = new Cube();
  bleft2.color = [0.89, 0.66, 0.05, 0.8];
  bleft2.matrix = bleft.matrix;
  bleft.matrix.translate(0, -1, 0);
  //neck.matrix.rotate(0, 1, 0, 0);
  //neck.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bleft2.color[0], bleft2.color[1], bleft2.color[2], bleft2.color[3]);
  drawCube(bleft2.matrix, bleft2.color);
  
  // joint
  var bleft3 = new Cube();
  bleft3.color = [0.89, 0.66, 0.05, 0.8];
  bleft3.matrix = new Matrix4(bleft.matrix);
  bleft3.matrix.translate(0, 0, 0);
  bleft3.matrix.rotate(g_bleftAngle2, 1, 0, 0);
  //neck.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bleft3.color[0], bleft3.color[1], bleft3.color[2], bleft3.color[3]);
  drawCube(bleft3.matrix, bleft3.color);

  var bleft4 = new Cube();
  bleft4.color = [0.89, 0.66, 0.05, 0.8];
  bleft4.matrix = bleft3.matrix;
  bleft4.matrix.translate(0, -1, 0);
  //bleft4.matrix.rotate(g_fleftAngle2, 1, 0, 0);
  //neck.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bleft4.color[0], bleft4.color[1], bleft4.color[2], bleft4.color[3]);
  drawCube(bleft4.matrix, bleft4.color);

  // joint 2
  var bleft6 = new Cube();
  bleft6.color = [0.23, 0.11, 0.0, 0.8];
  bleft6.matrix = new Matrix4(bleft3.matrix);
  bleft6.matrix.translate(0, -1, 0);
  bleft6.matrix.rotate(l_hoof_angle, 1, 0, 0);
  //neck.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bleft6.color[0], bleft6.color[1], bleft6.color[2], bleft6.color[3]);
  drawCube(bleft6.matrix, bleft6.color);

  var bleft5 = new Cube();
  bleft5.color = [0.23, 0.11, 0.0, 0.8];
  bleft5.matrix = bleft6.matrix;
  bleft5.matrix.translate(0, -1, 0);
  //bleft4.matrix.rotate(g_fleftAngle2, 1, 0, 0);
  //neck.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bleft5.color[0], bleft5.color[1], bleft5.color[2], bleft5.color[3]);
  drawCube(bleft5.matrix, bleft5.color);
  

  // back right leg
  var bright = new Cube();
  bright.color = [0.89, 0.66, 0.05, 0.8];
  bright.matrix.translate(0.15, -0.10, -0.325);
  bright.matrix.rotate(g_brightAngle1, 1, 0, 0);
  bright.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bright.color[0], bright.color[1], bright.color[2], bright.color[3]);
  drawCube(bright.matrix, bright.color);

  var bright1 = new Cube();
  bright1.color = [0.23, 0.11, 0.0, 0.8];
  bright1.matrix = bright.matrix;
  bright1.matrix.translate(0, -1, 0);
  //bright1.matrix.rotate(0, 1, 0, 0);
  //bright1.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bright1.color[0], bright1.color[1], bright1.color[2], bright1.color[3]);
  drawCube(bright1.matrix, bright1.color);

  var bright2 = new Cube();
  bright2.color = [0.89, 0.66, 0.05, 0.8];
  bright2.matrix = bright.matrix;
  bright2.matrix.translate(0, -1, 0);
  //bright2.matrix.rotate(0, 1, 0, 0);
  //bright2.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bright2.color[0], bright2.color[1], bright2.color[2], bright2.color[3]);
  drawCube(bright2.matrix, bright2.color);

  // joint
  var bright3 = new Cube();
  bright3.color = [0.89, 0.66, 0.05, 0.8];
  bright3.matrix = new Matrix4(bright.matrix);
  bright3.matrix.translate(0, 0, 0);
  bright3.matrix.rotate(g_brightAngle2, 1, 0, 0);
  //bright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bright3.color[0], bright3.color[1], bright3.color[2], bright3.color[3]);
  drawCube(bright3.matrix, bright3.color);

  var bright4 = new Cube();
  bright4.color = [0.89, 0.66, 0.05, 0.8];
  bright4.matrix = bright3.matrix;
  bright4.matrix.translate(0, -1, 0);
  //bright4.matrix.rotate(g_frightAngle2, 1, 0, 0);
  //bright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bright4.color[0], bright4.color[1], bright4.color[2], bright4.color[3]);
  drawCube(bright4.matrix, bright4.color);

  // joint 2
  var bright6 = new Cube();
  bright6.color = [0.23, 0.11, 0.0, 0.8];
  bright6.matrix = new Matrix4(bright3.matrix);
  bright6.matrix.translate(0, -1, 0);
  bright6.matrix.rotate(r_hoof_angle, 1, 0, 0);
  //bright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bright6.color[0], bright6.color[1], bright6.color[2], bright6.color[3]);
  drawCube(bright6.matrix, bright6.color);

  var bright5 = new Cube();
  bright5.color = [0.23, 0.11, 0.0, 0.8];
  bright5.matrix = bright6.matrix;
  bright5.matrix.translate(0, -1, 0);
  //bright4.matrix.rotate(g_frightAngle2, 1, 0, 0);
  //bright3.matrix.scale(0.075, 0.05, 0.10);
  gl.uniform4f(u_FragColor, bright5.color[0], bright5.color[1], bright5.color[2], bright5.color[3]);
  drawCube(bright5.matrix, bright5.color);

  // draw tail
  var tail = new Matrix4();
  tail.translate(0.05, 0, -0.25); 
  tail.rotate(120, 1, 0, 0); 
  tail.scale(0.08, 0.2, 0.08); 
  gl.uniform4f(u_FragColor, 0.89, 0.66, 0.05, 0.8); 
  gl.uniformMatrix4fv(u_ModelMatrix, false, tail.elements);
  drawCone(16);
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

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_lightOn, g_lightOn ? 1 : 0);

  // Pass the light position
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  gl.uniform1i(u_spotlightOn, g_spotlightOn ? 1 : 0);
  gl.uniform3f(u_lightDir, 0.0, -1.0, 0.0);         // pointing down
  gl.uniform1f(u_cutoff, Math.cos(Math.PI / 6));     // 30 degree cone

  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);

  gl.uniform1i(u_specularOn, 0);
  drawRoom();

  gl.uniform1i(u_specularOn, 1);  
  drawAnimal();                  

  var s = new Sphere();
  s.color = [1.0, 0, 0.79, 1];
  if (g_normalOn) {
    s.textureNum = -3;
  } else {
    s.textureNum = -2; 
  }
  s.matrix.translate(-ROOM_HALF + 2, 1.3, -ROOM_HALF + 2);
  s.matrix.scale(2, 2, 2);
  gl.uniform1i(u_specularOn, 1);
  gl.uniform4f(u_FragColor, 1.0, 0, 0.79, 1.0);
  s.render();

  var light = new Cube();
  light.textureNum = -2;
  light.color = [2,2,0,1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-.1,-.1,-.1);
  light.matrix.translate(-.5,-.5,-.5);
  gl.uniform1i(u_specularOn, 0);
  light.render();
}