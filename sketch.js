class Particle {
  constructor(x, y, mass) {
    this.pos = createVector(x, y);
    this.vel = createVector(1, 0);
    this.mass = mass;
    this.radius = this.scale_value(mass);
  }
  scale_value(v, base = 20, scale = 5) {
    return base + Math.log(v + 1) * scale;
  }

  update_pos() {
    this.vel.add(this.acceleration);
    this.pos.add(this.vel);
  }

  collide(other) {
    let impactVector = p5.Vector.sub(other.pos, this.pos);
    let d = impactVector.mag();
    if (d < this.radius + other.radius) {
      // Push the particles out so that they are not overlapping
      let overlap = d - (this.radius + other.radius);
      let dir = impactVector.copy();
      dir.setMag(overlap * 0.5);
      this.pos.add(dir);
      other.pos.sub(dir);

      // Correct the distance!
      d = this.radius + other.radius;
      impactVector.setMag(d);

      let mSum = this.mass + other.mass;
      let vDiff = p5.Vector.sub(other.vel, this.vel);
      // Particle A (this)
      let num = vDiff.dot(impactVector);
      let den = mSum * d * d;
      let deltaVA = impactVector.copy();
      deltaVA.mult((2 * other.mass * num) / den);
      this.vel.add(deltaVA);
      // Particle B (other)
      let deltaVB = impactVector.copy();
      deltaVB.mult((-2 * this.mass * num) / den);
      other.vel.add(deltaVB);
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
  run_self(other) {
    this.collide(other);
    this.edge();
    this.update_pos();
  }

  draw() {
    fill(127);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }
}

let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(i * 100, i * 20 + 100, 1));
  }
}

function draw() {
  background("black");
  for (let i in particles) {
    let particle = particles[i];
    particle.draw();
  }
  for (let i = 0; i < particles.length; i++) {
    let particleA = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      let particleB = particles[j];
      particleA.run_self(particleB);
    }
  }
}
