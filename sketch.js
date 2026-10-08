class Particle {
  constructor(x, y, mass, charge = 0) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.mass = mass;
    this.radius = this.scale_value(mass);
    this.charge = charge;
    this.color = charge < 0 ? "blue" : charge > 0 ? "red" : "green";
    this.acceleration = createVector(0, 0);
    this.force = createVector(0, 0);
  }
  scale_value(v, base = 10, scale = 2) {
    return base + Math.log(v + 1) * scale;
  }
  get_aceleration() {
    let a = p5.Vector.div(this.force, this.mass);
    this.force.set(0, 0);
    return a;
  }

  update_pos() {
    this.acceleration.set(0, 0);
    this.acceleration.add(this.get_aceleration());
    this.vel.add(this.acceleration);
    this.pos.add(this.vel);
  }

  collide(other) {
    let impactVector = p5.Vector.sub(other.pos, this.pos);
    let d = impactVector.mag();

    if (d == 0) {
      return;
    }

    let minDist = this.radius + other.radius;

    if (d < minDist) {
      // Normal direction from this particle to other
      let normal = impactVector.copy();
      normal.normalize();

      // Push particles apart
      let overlap = minDist - d;

      this.pos.sub(p5.Vector.mult(normal, overlap * 0.5));
      other.pos.add(p5.Vector.mult(normal, overlap * 0.5));

      // Relative velocity
      let relativeVel = p5.Vector.sub(other.vel, this.vel);

      // How much velocity is along the collision direction
      let speed = relativeVel.dot(normal);

      // If they are already separating, don't collide again
      if (speed >= 0) {
        return;
      }

      // Elastic collision
      let impulse = (2 * speed) / (this.mass + other.mass);

      this.vel.add(p5.Vector.mult(normal, impulse * other.mass));

      other.vel.sub(p5.Vector.mult(normal, impulse * this.mass));
    }
  }

  edge() {
    if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
      this.vel.x *= -1;
    } else if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
      this.vel.x *= -1;
    }

    if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
      this.vel.y *= -1;
    } else if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      this.vel.y *= -1;
    }
  }
  electric_force(other) {
    let dir = p5.Vector.sub(other.pos, this.pos);
    let dist = dir.mag();

    dir.normalize();

    let charges = this.charge * other.charge;
    let f = k * (charges / (dist * dist));
    let fv = dir.copy().mult(-f);

    this.force.add(fv);
  }

  draw() {
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }
}

class Protron extends Particle {
  constructor(x, y) {
    super(x, y, 1836, 1);
  }
}

class Electron extends Particle {
  constructor(x, y) {
    super(x, y, 1, -1);
  }
}
class Nuetron extends Particle {
  constructor(x, y) {
    super(x, y, 1839, 0);
  }
}

let protron;
let electron;
let nuetron;
let particles = [];
const k = 10000;

function setup() {
  createCanvas(windowWidth, windowHeight);
  protron = new Protron(100, 320);
  particles.push(protron);
  electron = new Electron(200, 149);
  particles.push(electron);
  nuetron = new Nuetron(320, 100);
  particles.push(nuetron);
}

function draw() {
  background("black");
  for (let i = 0; i < particles.length; i++) {
    let particleA = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      let particleB = particles[j];
      particleA.collide(particleB);
      particleA.electric_force(particleB);
      particleB.electric_force(particleA);
    }
  }

  // Movement
  for (let particle of particles) {
    particle.edge();
    particle.update_pos();
    particle.draw();
  }
}
