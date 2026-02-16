class Camera{
    constructor(){
        this.eye=new Vector(0,0,3);
        this.at=new Vector(0,0,-100);
        this.up=new Vector(0,1,0);
        this.speed = 0.05;
    }

forward() {
    var f = this.at.subtract(this.eye);
    f=f.divide(f.length());
    f=f.multiply(this.speed);
    console.log("has multiply:", typeof f.multiply); // add this
    //console.log("speed:", this.speed);  // add this
    //console.log("f after multiply:", f.elements);  // add this
    this.at=this.at.add(f);
    this.eye=this.eye.add(f);
}

back() {
    var f = this.eye.subtract(this.at);
    f=f.divide(f.length());
    f = f.multiply(this.speed);
    this.at=this.at.add(f);
    this.eye=this.eye.add(f);
}

left() {
    var f = this.eye.subtract(this.at);
    f=f.divide(f.length());
    var s=f.cross(this.up);
    s=s.divide(s.length());
    s=s.multiply(this.speed);
    this.at = this.at.add(s);
    this.eye = this.eye.add(s);   
}

right() {
    var f = this.at.subtract(this.eye);
    f = f.divide(f.length());
    var s = f.cross(this.up);
    s = s.divide(s.length());
    s = s.multiply(this.speed);
    this.at = this.at.add(s);
    this.eye = this.eye.add(s);
}

rotateLeft() {
    var f = this.at.subtract(this.eye);
    var angle = -2.0 * Math.PI / 180;
    var newF = new Vector(
        f.elements[0] * Math.cos(angle) - f.elements[2] * Math.sin(angle),
        f.elements[1],
        f.elements[0] * Math.sin(angle) + f.elements[2] * Math.cos(angle)
    );
    this.at = this.eye.add(newF);
}

rotateRight() {
    var f = this.at.subtract(this.eye);
    var angle = 2.0 * Math.PI / 180;
    var newF = new Vector(
        f.elements[0] * Math.cos(angle) - f.elements[2] * Math.sin(angle),
        f.elements[1],
        f.elements[0] * Math.sin(angle) + f.elements[2] * Math.cos(angle)
    );
    this.at = this.eye.add(newF);
}

rotateUp() {
        var f = this.at.subtract(this.eye);
        var s = f.cross(this.up);
        s = s.divide(s.length());
        
        var angle = 2.0 * Math.PI / 180;
        
        var rotatedF = new Vector(
            f.elements[0] * Math.cos(angle) + f.elements[1] * Math.sin(angle) * s.elements[2] - f.elements[2] * Math.sin(angle) * s.elements[1],
            f.elements[1] * Math.cos(angle) - f.elements[0] * Math.sin(angle) * s.elements[2] + f.elements[2] * Math.sin(angle) * s.elements[0],
            f.elements[2] * Math.cos(angle) + f.elements[0] * Math.sin(angle) * s.elements[1] - f.elements[1] * Math.sin(angle) * s.elements[0]
        );
        
        this.at = this.eye.add(rotatedF);
    }

 rotateDown() {
        var f = this.at.subtract(this.eye);
        var s = f.cross(this.up);
        s = s.divide(s.length());
        
        var angle = -2.0 * Math.PI / 180;
        
        var rotatedF = new Vector(
            f.elements[0] * Math.cos(angle) + f.elements[1] * Math.sin(angle) * s.elements[2] - f.elements[2] * Math.sin(angle) * s.elements[1],
            f.elements[1] * Math.cos(angle) - f.elements[0] * Math.sin(angle) * s.elements[2] + f.elements[2] * Math.sin(angle) * s.elements[0],
            f.elements[2] * Math.cos(angle) + f.elements[0] * Math.sin(angle) * s.elements[1] - f.elements[1] * Math.sin(angle) * s.elements[0]
        );
        
        this.at = this.eye.add(rotatedF);
    }
}