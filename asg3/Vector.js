class Vector {
    constructor(x, y, z) {
        this.elements = [x, y, z];
    }

    get x() { return this.elements[0]; }
    get y() { return this.elements[1]; }
    get z() { return this.elements[2]; }

    add(v) {
        return new Vector(
            this.elements[0] + v.elements[0],
            this.elements[1] + v.elements[1],
            this.elements[2] + v.elements[2]
        );
    }

    subtract(v) {
        return new Vector(
            this.elements[0] - v.elements[0],
            this.elements[1] - v.elements[1],
            this.elements[2] - v.elements[2]
        );
    }

    divide(s) {
        return new Vector(
            this.elements[0] / s,
            this.elements[1] / s,
            this.elements[2] / s
        );
    }

    length() {
        return Math.sqrt(
            this.elements[0] * this.elements[0] +
            this.elements[1] * this.elements[1] +
            this.elements[2] * this.elements[2]
        );
    }

    cross(v) {
        return new Vector(
            this.elements[1] * v.elements[2] - this.elements[2] * v.elements[1],
            this.elements[2] * v.elements[0] - this.elements[0] * v.elements[2],
            this.elements[0] * v.elements[1] - this.elements[1] * v.elements[0]
        );
    }

    multiply(s) {
    return new Vector(
        this.elements[0] * s,
        this.elements[1] * s,
        this.elements[2] * s
        );
    }
}