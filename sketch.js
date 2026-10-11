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
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(random(2, 6));
    this.acceleration = createVector(0, 0);
    this.mass = random(2, 6);
    this.r = sqrt(this.mass) * 20;
  }

  applyForce(force) {
    let f = force.copy();
    f.div(this.mass);
    this.acceleration.add(f);
  }

  // Method to update position
  update_pos() {
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

  // Method to display
  draw() {
    stroke(0);
    strokeWeight(2);
    fill(127);
    circle(this.position.x, this.position.y, this.r * 2);
  }
}
class Protron extends Particle {}
class Neutron extends Particle {}
class Electron extends Particle {}

let particles = [];
function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(100 * i, 100, 100, 100, 100));
  }
}
function draw() {
  background("black");
  for (let i = 1; i < particles.length; i++) {
    let particleA = particles[i];
    for (let j = 1; j < particles.length; j++) {
      let particleB = particles[j];
      particleA.collide(particleB);
      particleA.edges();
      particleA.update_pos();
      particleA.draw();
    }
  }
}
