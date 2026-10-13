class Atom {
  constructor(nucleus, electrons) {
    this.nucleus = nucleus;
    this.electrons = electrons;
  }
}
class Nucleus {
  constructor(protrons, neutrons) {
    this.protrons = protrons;
    this.neutrons = neutrons;
  }
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Simple Particle System

// A simple Particle class

class Particle {
  constructor(x, y, mass, charge, spin) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.mass = mass;
    this.spin = spin;
    this.charge = charge;
    this.r = this.scaleValue(this.mass);
    this.color = charge < 0 ? "blue" : charge > 0 ? "red" : "green  ";
  }
  scaleValue(v, base = 5, scale = 0.5) {
    return base + Math.log(v + 1) * scale;
  }
  applyForce(force) {
    let f = force.copy();
    f.div(this.mass);
    this.acceleration.add(f);
  }

  // Method to update position
  updatePosition() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  // Collision Detection and Resolution
  collide(other) {
    let impactVector = p5.Vector.sub(other.position, this.position);
    let d = impactVector.mag();
    if (d < this.r + other.r) {
      // Push the particles out so that they are not overlapping
      let overlap = d - (this.r + other.r);
      let dir = impactVector.copy();
      dir.setMag(overlap * 0.5);
      this.position.add(dir);
      other.position.sub(dir);

      // Correct the distance!
      d = this.r + other.r;
      impactVector.setMag(d);

      let mSum = this.mass + other.mass;
      let vDiff = p5.Vector.sub(other.velocity, this.velocity);
      // Particle A (this)
      let num = vDiff.dot(impactVector);
      let den = mSum * d * d;
      let deltaVA = impactVector.copy();
      deltaVA.mult((2 * other.mass * num) / den);
      this.velocity.add(deltaVA);
      // Particle B (other)
      let deltaVB = impactVector.copy();
      deltaVB.mult((-2 * this.mass * num) / den);
      other.velocity.add(deltaVB);
    }
  }

  // Bounce edges
  edges() {
    if (this.position.x > width - this.r) {
      this.position.x = width - this.r;
      this.velocity.x *= -1;
    } else if (this.position.x < this.r) {
      this.position.x = this.r;
      this.velocity.x *= -1;
    }

    if (this.position.y > height - this.r) {
      this.position.y = height - this.r;
      this.velocity.y *= -1;
    } else if (this.position.y < this.r) {
      this.position.y = this.r;
      this.velocity.y *= -1;
    }
  }

  electricForces(other) {
    let dir = p5.Vector.sub(this.position, other.position);
    let dist = dir.mag();

    let charge = this.charge * other.charge;

    let f = k * (charge / (dist * dist));

    let fv = dir.copy().mult(f);
    this.applyForce(fv);
  }

  // Method to display
  draw() {
    fill(this.color);
    circle(this.position.x, this.position.y, this.r * 2);
  }
}
class ParticleL extends Particle {
  constructor(x, y, mass, charge, spin) {
    super(x, y, mass, charge, spin);
  }
  strongForce(other) {
    if (other instanceof ParticleL) {
      let dir = p5.Vector.sub(this.position, other.position);
      let dist = dir.mag();
      if (Math.abs(dist) < 1) {
        console.log("close enough for nuclues");
      }
      let f = k * (-1 / dist);

      let fv = dir.copy().mult(f);
      this.applyForce(fv);
    }
  }
}
class Protron extends ParticleL {
  constructor(x, y) {
    super(x, y, 1836, 1, 1 / 2);
  }
}
class Neutron extends ParticleL {
  constructor(x, y) {
    super(x, y, 1839, 0, 1 / 2);
  }
}
class Electron extends Particle {
  constructor(x, y) {
    super(x, y, 1, -1, 1);
  }
}

let particles = [];
let k = 1;
function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 1; i < 2; i++) {
    particles.push(new Electron(154 * i, 230));
    particles.push(new Protron(254 * i, 350));
    particles.push(new Neutron(300 * i, 350));
  }
}
function draw() {
  background("black");

  for (let i = 0; i < particles.length; i++) {
    let particleA = particles[i];
    for (let j = 1; j < particles.length; j++) {
      let particleB = particles[j];
      if (particleA instanceof ParticleL) {
        particleA.strongForce(particleB);
      }
      if (particleB instanceof ParticleL) {
        particleB.strongForce(particleA);
      }
      particleA.collide(particleB);
      particleA.electricForces(particleB);
      particleB.electricForces(particleA);
    }
    particleA.updatePosition();
    particleA.edges();
    particleA.draw();
  }
}
