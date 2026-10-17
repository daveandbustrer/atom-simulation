const ELECTRIC_K = 300;
const STRONG_STRENGTH = 80;
const STRONG_RANGE = 100;
const MIN_DISTANCE = 10;
const MERGE_GAP = 2;

let particles = [];
let mergeQueue = [];
let queuedParticles = new Set();

class Particle {
  constructor(x, y, mass, charge, spin) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);

    this.mass = mass;
    this.charge = charge;
    this.spin = spin;

    this.r = this.scaleValue(mass);

    this.color =
      charge < 0 ? "dodgerblue" : charge > 0 ? "tomato" : "limegreen";
  }

  scaleValue(value, base = 5, scale = 0.5) {
    return base + Math.log(value + 1) * scale;
  }

  applyForce(force) {
    const acceleration = force.copy().div(this.mass);
    this.acceleration.add(acceleration);
  }

  updatePosition() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.set(0, 0);
  }

  electricForces(other) {
    const direction = p5.Vector.sub(this.position, other.position);

    const distanceSquared = direction.magSq();

    if (distanceSquared === 0) return;

    const softenedDistanceSquared = Math.max(
      distanceSquared,
      MIN_DISTANCE * MIN_DISTANCE,
    );

    const strength =
      (ELECTRIC_K * this.charge * other.charge) / softenedDistanceSquared;

    const force = direction.normalize().mult(strength);

    this.applyForce(force);
    other.applyForce(force.copy().mult(-1));
  }

  collide(other) {
    const normal = p5.Vector.sub(other.position, this.position);

    const distance = normal.mag();
    const minimumDistance = this.r + other.r;

    if (distance >= minimumDistance) return;

    if (distance === 0) {
      normal.set(1, 0);
    } else {
      normal.div(distance);
    }

    const inverseMassA = 1 / this.mass;
    const inverseMassB = 1 / other.mass;
    const inverseMassSum = inverseMassA + inverseMassB;

    const overlap = minimumDistance - distance;

    this.position.sub(
      normal.copy().mult((overlap * inverseMassA) / inverseMassSum),
    );

    other.position.add(
      normal.copy().mult((overlap * inverseMassB) / inverseMassSum),
    );

    const relativeVelocity = p5.Vector.sub(other.velocity, this.velocity);

    const velocityAlongNormal = relativeVelocity.dot(normal);

    if (velocityAlongNormal >= 0) return;

    const restitution = 1;

    const impulseMagnitude =
      (-(1 + restitution) * velocityAlongNormal) / inverseMassSum;

    const impulse = normal.copy().mult(impulseMagnitude);

    this.velocity.sub(impulse.copy().mult(inverseMassA));

    other.velocity.add(impulse.copy().mult(inverseMassB));
  }

  edges() {
    if (width <= this.r * 2) {
      this.position.x = width / 2;
      this.velocity.x = 0;
    } else if (this.position.x > width - this.r) {
      this.position.x = width - this.r;
      this.velocity.x = -Math.abs(this.velocity.x);
    } else if (this.position.x < this.r) {
      this.position.x = this.r;
      this.velocity.x = Math.abs(this.velocity.x);
    }
    if (height <= this.r * 2) {
      this.position.y = height / 2;
      this.velocity.y = 0;
    } else if (this.position.y > height - this.r) {
      this.position.y = height - this.r;
      this.velocity.y = -Math.abs(this.velocity.y);
    } else if (this.position.y < this.r) {
      this.position.y = this.r;
      this.velocity.y = Math.abs(this.velocity.y);
    }
  }

  otherNeeded(other) {
    this.electricForces(other);
    this.collide(other);
  }

  draw() {
    push();
    noStroke();
    fill(this.color);
    circle(this.position.x, this.position.y, this.r * 2);
    pop();
  }

  solo() {
    this.updatePosition();
    this.edges();
    this.draw();
  }
}
class NuclearParticle extends Particle {
  constructor(x, y, mass, charge, spin) {
    super(x, y, mass, charge, spin);
    this.protons = [];
    this.neutrons = [];
  }

  strongForce(other) {
    const direction = p5.Vector.sub(other.position, this.position);
    const distance = direction.mag();

    if (distance === 0 || distance >= STRONG_RANGE) {
      return;
    }

    const strength = STRONG_STRENGTH * (1 - distance / STRONG_RANGE);
    const force = direction.normalize().mult(strength);

    this.applyForce(force);
    other.applyForce(force.copy().mult(-1));
  }

  otherNeeded(other) {
    if (!(other instanceof NuclearParticle)) {
      super.otherNeeded(other);
      return;
    }

    const distance = p5.Vector.dist(this.position, other.position);

    if (distance <= this.r + other.r + MERGE_GAP) {
      if (queueMerge(this, other)) {
        return;
      }
    }

    this.strongForce(other);
    super.otherNeeded(other);
  }
}
class Proton extends NuclearParticle {
  constructor(x, y) {
    super(x, y, 1836, 1, 1 / 2);
    this.protons = [this];
  }
}
class Neutron extends NuclearParticle {
  constructor(x, y) {
    super(x, y, 1839, 0, 1 / 2);
    this.neutrons = [this];
  }
}
class Electron extends Particle {
  constructor(x, y) {
    super(x, y, 1, -1, 1 / 2);
  }
}

class Nucleus extends NuclearParticle {
  constructor(a, b) {
    const mass = a.mass + b.mass;
    const position = a.position
      .copy()
      .mult(a.mass)
      .add(b.position.copy().mult(b.mass))
      .div(mass);

    super(position.x, position.y, mass, a.charge + b.charge, null);

    this.protons = [...a.protons, ...b.protons];
    this.neutrons = [...a.neutrons, ...b.neutrons];

    this.velocity = a.velocity
      .copy()
      .mult(a.mass)
      .add(b.velocity.copy().mult(b.mass))
      .div(mass);

    this.acceleration = a.acceleration
      .copy()
      .mult(a.mass)
      .add(b.acceleration.copy().mult(b.mass))
      .div(mass);

    const nucleonCount = this.protons.length + this.neutrons.length;

    this.r = 8 + Math.sqrt(nucleonCount) * 4;
    this.color = "orange";
  }

  draw() {
    super.draw();

    push();
    fill("white");
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(11);

    text(
      `${this.protons.length}p ${this.neutrons.length}n`,
      this.position.x,
      this.position.y - this.r - 12,
    );

    pop();
  }
}

//will implement later
class Atom {
  constructor(nucleus, electrons = []) {
    this.nucleus = nucleus;
    this.electrons = electrons;
  }
}

function queueMerge(a, b) {
  if (a === b) return false;

  if (queuedParticles.has(a) || queuedParticles.has(b)) {
    return false;
  }

  queuedParticles.add(a);
  queuedParticles.add(b);

  mergeQueue.push([a, b]);

  return true;
}

function processMerges() {
  if (mergeQueue.length === 0) return;

  const removed = new Set();
  const added = [];

  for (const [a, b] of mergeQueue) {
    if (removed.has(a) || removed.has(b)) {
      continue;
    }

    added.push(new Nucleus(a, b));

    removed.add(a);
    removed.add(b);
  }

  particles = particles.filter((particle) => !removed.has(particle));

  particles.push(...added);

  mergeQueue = [];
  queuedParticles.clear();
}

function resetSimulation() {
  particles = [];
  mergeQueue = [];
  queuedParticles.clear();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetSimulation();
}

function draw() {
  background("black");

  mergeQueue = [];
  queuedParticles.clear();

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      particles[i].otherNeeded(particles[j]);
    }
  }

  processMerges();

  for (const particle of particles) {
    particle.solo();
  }

  drawInstructions();
}

function drawInstructions() {
  push();

  noStroke();
  fill(220);
  textAlign(LEFT, TOP);
  textSize(13);

  text(
    "Blue: electron | Red: proton | Green: neutron | Orange: nucleus\n" +
      "Click: add proton | Shift + click: add neutron\n" +
      "E: add electron at mouse | R: reset",
    14,
    14,
  );

  pop();
}

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }

  if (keyIsDown(SHIFT)) {
    particles.push(new Neutron(mouseX, mouseY));
  } else {
    particles.push(new Proton(mouseX, mouseY));
  }

  return false;
}

function keyPressed() {
  if (key === "r" || key === "R") {
    resetSimulation();
  }

  if (key === "e" || key === "E") {
    particles.push(
      new Electron(constrain(mouseX, 0, width), constrain(mouseY, 0, height)),
    );
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
