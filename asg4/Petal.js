class Petal {
  constructor() {
    // set up petal fall height, speed, and randomness
    this.x = Math.random() * 30 - 15; 
    this.y = 10; 
    this.z = Math.random() * 30 - 15; 
    this.fallSpeed = 0.02 + Math.random() * 0.02; 
    this.rotation = Math.random() * 360; 
  }
  
  update() {
    // have them fall, spin slow, and disappear when they hit the ground
    this.y -= this.fallSpeed; 
    this.rotation += 2; 
    return this.y > -1; 
  }
  
  render() {
    // petal attributes
    var petal = new Cube();
    petal.color = [1, 0.7, 0.8, 1]; 
    petal.textureNum = 2; 
    petal.matrix.translate(this.x, this.y, this.z);
    petal.matrix.rotate(this.rotation, 0, 1, 0);
    petal.matrix.scale(0.3, 0.1, 0.3); 
    petal.renderfast();
  }
}