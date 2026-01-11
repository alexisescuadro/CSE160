// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  //ctx.fillStyle = 'rgba(0, 0, 255, 1.0)'; // Set color to blue
  //ctx.fillRect(120, 10, 150, 150);        // Fill a rectangle with the color

  // Draw a black rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color

  // Create vector v1
  var v1 = new Vector3([2.25,2.25,0]);
  drawVector(v1, "red")
}

// drawVector function
  function drawVector(v, color) {
    const canvas = document.getElementById("example");
    const ctx = canvas.getContext("2d");

    var startX = canvas.width / 2;
    var startY = canvas.height / 2;

    var endX = startX + v.elements[0] * 20;
    var endY = startY - v.elements[1] * 20;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.strokeStyle = color;
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

const canvas = document.getElementById('example');
const ctx = canvas.getContext('2d');

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color
}

// handleDrawEvent function
function handleDrawEvent() {
  clearCanvas();

  // draw vector v1
  let v1_xval = document.getElementById("v1_x").value;
  let v1_yval = document.getElementById("v1_y").value;
  var v1 = new Vector3([v1_xval,v1_yval,0]);
  drawVector(v1, "red");

  // draw vector v2
  let v2_xval = document.getElementById("v2_x").value;
  let v2_yval = document.getElementById("v2_y").value;
  var v2 = new Vector3([v2_xval,v2_yval,0]);
  drawVector(v2, "blue");

  console.log(v1_x, v1_y);
}

// handleDrawOperationEvent function
function handleDrawOperationEvent() {
  clearCanvas();

  // draw vector v1
  let v1_xval = document.getElementById("v1_x").value;
  let v1_yval = document.getElementById("v1_y").value;
  var v1 = new Vector3([v1_xval,v1_yval,0]);
  drawVector(v1, "red");

  // draw vector v2
  let v2_xval = document.getElementById("v2_x").value;
  let v2_yval = document.getElementById("v2_y").value;
  var v2 = new Vector3([v2_xval,v2_yval,0]);
  drawVector(v2, "blue");

  // get operation
  const op = document.getElementById('operations');
  const value = op.value;
  console.log(value);

  // get scalar
  let scalar = document.getElementById("scalar").value;


  if (value == "add") {
    v1.add(v2);
    console.log(v1);
    // draw vector
    drawVector(v1, "green");
  } else if (value == "subtract") {
    v1.sub(v2);
    drawVector(v1, "green");
  } else if (value == "multiply") {
    v1.mul(scalar);
    v2.mul(scalar);
    drawVector(v1, "green");
    drawVector(v2, "green");
  } else if (value == "divide") {
    v1.div(scalar);
    v2.div(scalar);
    drawVector(v1, "green");
    drawVector(v2, "green");
  } else if (value == "magnitude") {
    console.log("Magnitude v1: " + v1.magnitude());
    console.log("Magnitude v2: " + v2.magnitude());
  } else if (value == "normalize") {
    v1.normalize();
    v2.normalize();
    drawVector(v1,"green");
    drawVector(v2,"green");
  } else if (value == "angle-between") {
    console.log("Angle: " + Vector3.angleBetween(v1,v2));
  } else if (value == "area") {
    console.log("Area of the triangle: " + Vector3.areaTriangle(v1,v2));
  } else {
    console.log("nothing");
  }
 
}
