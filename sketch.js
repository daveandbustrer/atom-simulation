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

    if (d < 0.001) {
      impactVector = createVector(1, 0);
      d = 0.001;
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
    let distSq = dir.magSq();

    // Prevent division by zero
    if (distSq < 0.0001) {
      return;
    }

    let charges = this.charge * other.charge;
    let f = k * (charges / distSq);

    dir.normalize();
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
  create_nucleus(other) {
    // Make sure neither particle has already been removed
    if (!particles.includes(this) || !particles.includes(other)) {
      return;
    }

    let members = [this, other];

    let protons = members.filter((p) => p instanceof Protron);
    let neutrons = members.filter((p) => p instanceof Neutron);

    // Remove both original particles
    particles = particles.filter((p) => p !== this && p !== other);

    // Replace them with one nucleus object
    particles.push(new nucleus(protons, neutrons));
  }
  strong_force(other) {
    let dir = p5.Vector.sub(other.pos, this.pos);
    let centerDist = dir.mag();

    if (centerDist < 0.0001) {
      return;
    }

    let dist = centerDist - this.radius - other.radius;
    dist = max(0, dist);

    // Only fuse when the particles are almost touching
    if (dist <= nm * 0.1) {
      pendingFusions.push([this, other]);
      return;
    }

    // The strong force has a limited range
    if (dist > nm * 5) {
      return;
    }

    dir.normalize();

    let x = dist / nm;

    let repulsion = 10 * exp(-pow(x / 0.5, 2));
    let attraction = 5 * exp(-pow((x - 1.5) / 0.8, 2));

    let f = repulsion - attraction;
    let fv = dir.copy().mult(-f);

    // Equal and opposite forces
    this.force.add(fv);
    other.force.sub(fv);
  }
  need_other(other) {
    super.need_other(other);

    if (other instanceof ParticleLarge) {
      this.strong_force(other);
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
class nucleus extends Particle {
  constructor(protrons, neutrons) {
    let total_pos = createVector(0, 0);
    let size = 0;
    for (let i in protrons) {
      let protron = protrons[i];
      total_pos.add(protron.pos);
      size += protron.radius * 2;
    }
    for (let i in neutrons) {
      let neutron = neutrons[i];
      total_pos.add(neutron.pos);
      size += neutron.radius * 2;
    }
    let center = total_pos.div(protrons.length + neutrons.length);
    super(
      center.x,
      center.y,
      1836 * protrons.length + 1839 * neutrons.length,
      protrons.length,
    );
    this.protrons = protrons;
    this.neutrons = neutrons;
    this.radius = size;
  }
  draw() {
    for (let i in this.protrons) {
      let protron = this.protrons[i];
      fill("red");
      circle(protron.pos.x, protron.pos.y, protron.radius * 2);
    }
    for (let i in this.neutrons) {
      let neutrons = this.neutrons[i];
      fill("green");
      circle(neutrons.pos.x, neutrons.pos.y, neutrons.radius * 2);
    }
  }
  update_pos() {
    let oldPos = this.pos.copy();

    super.update_pos();

    let displacement = p5.Vector.sub(this.pos, oldPos);

    for (let proton of this.protrons) {
      proton.pos.add(displacement);
    }

    for (let neutron of this.neutrons) {
      neutron.pos.add(displacement);
    }
  }
}

let protron;
let electron;
let nuetron;
let particles = [];
let pendingFusions = [];
let particleType = 0;
let draw_window = false;
const k = 100;
const nm = 5;

function setup() {
  createCanvas(windowWidth, windowHeight);
  protron = new Protron(300, 320);
  particles.push(protron);
  electron = new Electron(200, 149);
  particles.push(electron);
  nuetron = new Neutron(320, 300);
  particles.push(nuetron);
}
function mouseWheel(event) {
  if (event.delta > 0) {
    if (particleType + 1 > 1) particleType = -1;
    else particleType++;
  } else if (event.delta < 0) {
    if (particleType - 1 < -1) particleType = 1;
    else particleType--;
  }
}
function mousePressed() {
  if (particleType === -1) particles.push(new Electron(mouseX, mouseY));
  else if (particleType === 0) particles.push(new Neutron(mouseX, mouseY));
  else if (particleType === 1) particles.push(new Protron(mouseX, mouseY));
}
function Rect(x, y, width, height, color = "white") {
  fill(color);
  quad(
    x - width,
    y - height,
    x - width,
    y + height,
    x + width,
    y + height,
    x + width,
    y - height,
  );
}
function draw() {
  background("black");
  pendingFusions = [];
  Rect(width / 2, 100, 200, 100, "gray");
  fill(particleType < 0 ? "blue" : particleType > 0 ? "red" : "green");
  circle(width / 2 - 150, 100, 50);
  fill("black");
  text(
    `${particleType < 0 ? "electron" : particleType > 0 ? "protron" : "neutron"} click to place at mouse`,
    width / 2 - 100,
    100,
  );
  // Calculate interactions between each pair
  for (let i = 0; i < particles.length; i++) {
    let particleA = particles[i];

    for (let j = i + 1; j < particles.length; j++) {
      let particleB = particles[j];

      particleA.need_other(particleB);
    }
  }

  // Create nuclei after calculating all interactions
  for (let [a, b] of pendingFusions) {
    if (particles.includes(a) && particles.includes(b)) {
      a.create_nucleus(b);
    }
  }

  // Move and draw every particle
  for (let particle of particles) {
    particle.solo_things();
  }
}
