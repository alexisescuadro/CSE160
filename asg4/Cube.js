class Cube {
  constructor() {
    this.type="cube";
    //this.position = [0.0,0.0,0.0];
    this.color = [1.0,1.0,1.0,1.0];
    //this.size = 5.0;
    //this.segments = 10;
    this.matrix = new Matrix4();
    this.textureNum = -1;
  }

  render() {
    //var xy = this.position;
    var rgba = this.color;
    //var size = this.size;

    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    // Pass the matrix to u_ModelMatrix attribute
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Front of cube
    drawTriangle3DUVNormal(
      [0,0,0, 1,0,0, 1,1,0], 
      [0,0, 1,0, 1,1],
      [0,0, -1, 0, 0, -1, 0, 0, -1]);

    drawTriangle3DUVNormal([0,0,0, 1,1,0, 0,1,0], [0,0, 1,1, 0,1], [0,0,-1, 0,0,-1, 0,0,-1]);

    //xgl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

    // Back face
    drawTriangle3DUVNormal([1,0,1, 0,0,1, 0,1,1], [0,0, 1,0, 1,1], [0,0,1, 0,0,1, 0,0,1]);
    drawTriangle3DUVNormal([1,0,1, 0,1,1, 1,1,1], [0,0, 1,1, 0,1], [0,0,1, 0,0,1, 0,0,1]);

    // Top face
    drawTriangle3DUVNormal([0,1,0, 1,1,0, 1,1,1], [0,0, 1,0, 1,1], [0,1,0, 0,1,0, 0,1,0]);
    drawTriangle3DUVNormal([0,1,0, 1,1,1, 0,1,1], [0,0, 1,1, 0,1], [0,1,0, 0,1,0, 0,1,0]);

    // Bottom face
    drawTriangle3DUVNormal([0,0,1, 1,0,1, 1,0,0], [0,0, 1,0, 1,1], [0,-1,0, 0,-1,0, 0,-1,0]);
    drawTriangle3DUVNormal([0,0,1, 1,0,0, 0,0,0], [0,0, 1,1, 0,1], [0,-1,0, 0,-1,0, 0,-1,0]);

    // Right face
    drawTriangle3DUVNormal([1,0,0, 1,0,1, 1,1,1], [0,0, 1,0, 1,1], [1,0,0, 1,0,0, 1,0,0]);
    drawTriangle3DUVNormal([1,0,0, 1,1,1, 1,1,0], [0,0, 1,1, 0,1], [1,0,0, 1,0,0, 1,0,0]);

    // Left face
    drawTriangle3DUVNormal([0,0,1, 0,0,0, 0,1,0], [0,0, 1,0, 1,1], [-1,0,0, -1,0,0, -1,0,0]);
    drawTriangle3DUVNormal([0,0,1, 0,1,0, 0,1,1], [0,0, 1,1, 0,1], [-1,0,0, -1,0,0, -1,0,0]);
  }

  renderfast() {
    //var xy = this.position;
    var rgba = this.color;
    //var size = this.size;

    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix to u_ModelMatrix attribute
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var allverts=[];
    var alluvs=[];

    // front face
    allverts = allverts.concat([0,0,0, 1,1,0, 1,0,0]);
    alluvs = alluvs.concat([0,0, 1,1, 1,0]);

    allverts = allverts.concat([0,0,0, 0,1,0, 1,1,0]);
    alluvs = alluvs.concat([0,0, 0,1, 1,1]);

    // top
    allverts = allverts.concat([0,1,0, 0,1,1, 1,1,1]);
    alluvs = alluvs.concat([0,0, 0,1, 1,1]);

    allverts = allverts.concat([0,1,0, 1,1,1, 1,1,0]);
    alluvs = alluvs.concat([0,0, 1,1, 1,0]);

    // right
    allverts = allverts.concat([1,1,0, 1,1,1, 1,0,0]);
    alluvs = alluvs.concat([0,1, 1,1, 0,0]);

    allverts = allverts.concat([1,0,0, 1,1,1, 1,0,1]);
    alluvs = alluvs.concat([0,0, 1,1, 1,0]);

    // left
    allverts = allverts.concat([0,1,0, 0,1,1, 0,0,0]);
    alluvs = alluvs.concat([1,1, 0,1, 1,0]);

    allverts = allverts.concat([0,0,0, 0,1,1, 0,0,1]);
    alluvs = alluvs.concat([1,0, 0,1, 0,0]);

    // bottom
    allverts = allverts.concat([0,0,0, 0,0,1, 1,0,1]);
    alluvs = alluvs.concat([0,1, 0,0, 1,0]);

    allverts = allverts.concat([0,0,0, 1,0,1, 1,0,0]);
    alluvs = alluvs.concat([0,1, 1,0, 1,1]);

    // back
    allverts = allverts.concat([0,0,1, 1,1,1, 1,0,1]);
    alluvs = alluvs.concat([1,0, 0,1, 0,0]);

    allverts = allverts.concat([0,0,1, 0,1,1, 1,1,1]);
    alluvs = alluvs.concat([1,0, 1,1, 0,1]);
    drawTriangle3DUV(allverts, alluvs);
  }
}