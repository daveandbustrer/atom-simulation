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
  scale_value(v, base = 5, scale = 0.5) {
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
  need_other(other) {
    this.collide(other);
    this.electric_force(other);
    other.electric_force(this);
  }
  solo_things() {
    this.edge();
    this.update_pos();
    this.draw();
  }
  draw() {
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }
}
class ParticleLarge extends Particle {
  constructor(x, y, mass, charge = 0) {
    super(x, y, mass, charge);
  }
  strong_force(other) {
    let dir = p5.Vector.sub(other.pos, this.pos);
    let centerDist = dir.mag();

    if (centerDist == 0) {
      return;
    }

    let dist = centerDist - this.radius - other.radius;
    dist = max(0, dist);

    dir.normalize();

    let x = dist / nm;

    let repulsion = 10 * exp(-pow(x / 0.5, 2));
    let attraction = 10 * exp(-pow((x - 1.5) / 0.8, 2));

    let f = repulsion - attraction;

    let fv = dir.copy().mult(-f);

    this.force.add(fv);
  }
  need_other(other) {
    super.need_other(other);
    if (other instanceof ParticleLarge) {
      this.strong_force(other);
      other.strong_force(this);
    }
  }
}
class Protron extends ParticleLarge {
  constructor(x, y) {
    super(x, y, 1836, 1);
  }
}

class Electron extends Particle {
  constructor(x, y) {
    super(x, y, 1, -1);
  }
}
class Neutron extends ParticleLarge {
  constructor(x, y) {
    super(x, y, 1839, 0);
  }
}

let protron;
let electron;
let nuetron;
let particles = [];
const k = 1;
const nm = 5;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(3000);
  protron = new Protron(300, 320);
  particles.push(protron);
  particles.push(protron);
  electron = new Electron(200, 149);
  particles.push(electron);
  particles.push(electron);
  nuetron = new Neutron(300, 320);
  particles.push(nuetron);
}

function draw() {
  background("black");
  for (let i = 0; i < particles.length; i++) {
    let particleA = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      let particleB = particles[j];
      particleA.need_other(particleB);
    }
  }

  // Movement
  for (let particle of particles) {
    particle.solo_things();
  }
}
