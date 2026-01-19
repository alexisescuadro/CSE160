// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() { 
     gl_Position = a_Position; 
     gl_PointSize = u_Size;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
     gl_FragColor = u_FragColor;
  }
`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let g_rainbowHue = 0;
let g_isRainbow = false;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
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

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get the storage location of u_Size");
    return;
  }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI() {

  // Button Events (Shape Type)
  //document.getElementById("green").onclick = function() { g_selectedColor = [0.0,1.0,0.0,1.0]; };
  //document.getElementById("red").onclick = function() { g_selectedColor = [1.0,0.0,0.0,1.0]; };
  document.getElementById("clearButton").onclick = function() {g_shapesList = []; renderAllShapes(); };

  document.getElementById("pointButton").onclick = function() {g_selectedType=POINT};
  document.getElementById("triButton").onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById("circleButton").onclick = function() {g_selectedType=CIRCLE};
 
  // Slider Events
  document.getElementById("redSlide").addEventListener("mouseup", function() { g_selectedColor[0] = this.value/100; });
  document.getElementById("greenSlide").addEventListener("mouseup", function() { g_selectedColor[1] = this.value/100; });
  document.getElementById("blueSlide").addEventListener("mouseup", function() { g_selectedColor[2] = this.value/100; });

  // Size Slider Events
  document.getElementById("sizeSlide").addEventListener("mouseup", function() {g_selectedSize = this.value; });

  // Draw flower!
  document.getElementById("drawFlower").onclick = function() {generateFlower(); };

  // Rainbow Brush!
  document.getElementById("rainbowButton").onclick = function() {g_isRainbow = !g_isRainbow; };
}

function main() {

  // Set up canvas and gl variables
  setupWebGL();

  // Set up GLSL shader programs and connect GLSL variables
  connectVariablestoGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev)} };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = [];

function click(ev) {

  // Extract the event click and return it in the WebGL coordinates
  [x,y] = convertCoordinatesEventtoGL(ev);

  // Create and store the new point
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
  renderAllShapes();
}

function convertCoordinatesEventtoGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {

    g_shapesList[i].render();
  }

}

function generateFlower() {

  let flower = {
    type: "flower",
    render: function() {

    // Draw the stem
    let d = 0;
    for (i = 0; i < 8; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.05, -0.9+d,  
        -0.05, -1.0+d,   
        0.05, -1.0+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 8; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.05, -0.9+d,  
        0.05, -0.9+d,   
        0.05, -1.0+d  
      ])
      d += 0.10;
    }

    // Draw the right leaf
    // Draw 3 up next to stem
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.05, -0.9+d,  
        0.05, -1.0+d,   
        0.15, -1.0+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.05, -0.9+d,  
        0.15, -0.9+d,   
        0.15, -1.0+d  
      ])
      d += 0.10;
    }

    // Draw 2 to the side on the bottom
    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.15+d, -0.9,  
        0.15+d, -1.0,   
        0.25+d, -1.0  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.15+d, -0.9,  
        0.25+d, -0.9,   
        0.25+d, -1.0  
      ])
      d += 0.10;
    }

    // Draw bottom of leaf (diagonally right)
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.35+d, -0.8+d,  
        0.35+d, -0.9+d,   
        0.45+d, -0.9+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.35+d, -0.8+d,  
        0.45+d, -0.8+d,   
        0.45+d, -0.9+d  
      ])
      d += 0.10;
    }

    // Draw top of leaf (diagonally left)
    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.55-d, -0.5+d,  
        0.55-d, -0.6+d,   
        0.65-d, -0.6+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.55-d, -0.5+d,  
        0.65-d, -0.5+d,   
        0.65-d, -0.6+d  
      ])
      d += 0.10;
    }

    // Draw top most of leaf (diagonally right)
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.15+d, -0.6+d,  
        0.15+d, -0.7+d,   
        0.25+d, -0.7+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        0.15+d, -0.6+d,  
        0.25+d, -0.6+d,   
        0.25+d, -0.7+d  
      ])
      d += 0.10;
    }


    // Draw the left leaf
    // Draw 3 up next to stem
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.15, -0.9+d,  
        -0.15, -1.0+d,   
        -0.05, -1.0+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.15, -0.9+d,  
        -0.05, -0.9+d,   
        -0.05, -1.0+d  
      ])
      d += 0.10;
    }

    // Draw 2 to the side on the bottom
    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.25-d, -0.9,  
        -0.25-d, -1.0,   
        -0.15-d, -1.0  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.25-d, -0.9,  
        -0.15-d, -0.9,   
        -0.15-d, -1.0  
      ])
      d += 0.10;
    }

    // Draw bottom of leaf (diagonally left)
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.45-d, -0.8+d,  
        -0.45-d, -0.9+d,   
        -0.35-d, -0.9+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.45-d, -0.8+d,  
        -0.35-d, -0.8+d,   
        -0.35-d, -0.9+d  
      ])
      d += 0.10;
    }

    // Draw top of leaf (diagonally right)
    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.65+d, -0.5+d,  
        -0.65+d, -0.6+d,   
        -0.55+d, -0.6+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.65+d, -0.5+d,  
        -0.55+d, -0.5+d,   
        -0.55+d, -0.6+d  
      ])
      d += 0.10;
    }

    // Draw top most of leaf (diagonally right)
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.25-d, -0.6+d,  
        -0.25-d, -0.7+d,   
        -0.15-d, -0.7+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.09, 0.361, 0.106, 1.0);
      drawTriangle([
        -0.25-d, -0.6+d,  
        -0.15-d, -0.6+d,   
        -0.15-d, -0.7+d  
      ])
      d += 0.10;
    }

    // Draw center of flower
    // Draw triangles vertically
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.929, 0.820, 0.294, 1.0);
      drawTriangle([
        -0.15+d, 0.3,  
        -0.15+d, 0.2,   
        -0.05+d, 0.2  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.929, 0.820, 0.294, 1.0);
      drawTriangle([
        -0.15+d, 0.3,  
        -0.05+d, 0.3,   
        -0.05+d, 0.2  
      ])
      d += 0.10;
    }

    // Draw triangles horizontally
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.929, 0.820, 0.294, 1.0);
      drawTriangle([
        -0.05, 0.2+d,  
        -0.05, 0.1+d,   
        0.05, 0.1+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.929, 0.820, 0.294, 1.0);
      drawTriangle([
        -0.05, 0.2+d,  
        0.05, 0.2+d,   
        0.05, 0.1+d  
      ])
      d += 0.10;
    }

    // Draw dark pink center of flower
    // Draw left diagonal up
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.624, 0.192, 0.467, 1.0);
      drawTriangle([
        -0.05-d, 0.1+d,  
        -0.05-d, 0.0+d,   
        0.05-d, 0.0+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.624, 0.192, 0.467, 1.0);
      drawTriangle([
        0.15-d, 0.3+d,  
        0.25-d, 0.3+d,   
        0.25-d, 0.2+d  
      ])
      d += 0.10;
    }

    // Draw right diagonal up
    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.624, 0.192, 0.467, 1.0);
      drawTriangle([
        0.05+d, 0.1+d,  
        0.05+d, 0.0+d,   
        -0.05+d, 0.0+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 3; i++) {
      gl.uniform4f(u_FragColor, 0.624, 0.192, 0.467, 1.0);
      drawTriangle([
        -0.15+d, 0.3+d,  
        -0.25+d, 0.3+d,   
        -0.25+d, 0.2+d  
      ])
      d += 0.10;
    }

    // Draw main petals

    // Draw right diagonal up
    d = 0;
    for (i = 0; i < 4; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        -0.05-d, 0.0+d,  
        -0.05-d, -0.1+d,   
        0.05-d, -0.1+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 4; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.25-d, 0.3+d,  
        0.35-d, 0.3+d,   
        0.35-d, 0.2+d  
      ])
      d += 0.10;
    }

    // Draw left diagonal up
    d = 0;
    for (i = 0; i < 4; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.05+d, 0+d,  
        0.05+d, -0.1+d,   
        -0.05+d, -0.1+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 4; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        -0.25+d, 0.3+d,  
        -0.35+d, 0.3+d,   
        -0.35+d, 0.2+d  
      ])
      d += 0.10;
    }

    // Draw top petal

    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        -0.05+d, 0.6+d,  
        -0.05+d, 0.5+d,   
        -0.15+d, 0.5+d  
      ])
      d += 0.10;
    }

    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.05, 0.6,  
        0.05, 0.5,   
        0.15, 0.5  
      ])

    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.05, 0.7,  
        -0.05, 0.7,   
        -0.05, 0.6  
      ])

    // Draw right petal

    // Draw left petal
    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        -0.35+d, 0.3+d,  
        -0.35+d, 0.2+d,   
        -0.45+d, 0.2+d  
      ])
      d += 0.10;
    }

    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.05+d, -0.1+d,  
        -0.05+d, -0.1+d,   
        -0.05+d, -0.2+d  
      ])
      d += 0.10;
    }

    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        -0.35, 0.3,  
        -0.45, 0.3,   
        -0.45, 0.2 
      ])

    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        -0.35, 0.2,  
        -0.25, 0.2,   
        -0.25, 0.1 
      ])

    // Draw bottom petal
    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.05, -0.1,  
        0.05, -0.2,   
        -0.05, -0.2 
      ])

    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        -0.15, 0,  
        -0.05, 0,   
        -0.05, -0.1 
      ])

    // Draw right flower
    d = 0;
    for (i = 0; i < 2; i++) {
      gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.25+d, 0.4-d,  
        0.25+d, 0.3-d,   
        0.35+d, 0.3-d  
      ])
      d += 0.10;
    }

    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.35, 0.2,  
        0.25, 0.2,   
        0.25, 0.1 
      ])

    gl.uniform4f(u_FragColor, 1.0, 0.639, 0.902, 1.0);
      drawTriangle([
        0.35, 0.3,  
        0.45, 0.3,   
        0.45, 0.2 
      ])

    // Draw other petals
    gl.uniform4f(u_FragColor, 0.839, 0.639, 1, 1.0);
      drawTriangle([
        -0.15, 0.5,  
        -0.25, 0.5,   
        -0.25, 0.4 
      ])

      gl.uniform4f(u_FragColor, 0.839, 0.639, 1, 1.0);
      drawTriangle([
        0.15, 0.5,  
        0.25, 0.5,   
        0.25, 0.4 
      ])

      gl.uniform4f(u_FragColor, 0.839, 0.639, 1, 1.0);
      drawTriangle([
        0.25, 0.1,  
        0.25, 0,   
        0.15, 0 
      ])

      gl.uniform4f(u_FragColor, 0.839, 0.639, 1, 1.0);
      drawTriangle([
        -0.25, 0.1,  
        -0.25, 0,   
        -0.15, 0 
      ])
    }
    }
  g_shapesList.push(flower);
  renderAllShapes();
}
