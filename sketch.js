class Particle {
  constructor(x, y, mass, charge = 0) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(2, 6));
    this.mass = mass;
    this.radius = this.scale_value(mass);
    this.charge;
  }
  scale_value(v, base = 20, scale = 5) {
    return base + Math.log(v + 1) * scale;
  }

  update_pos() {
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
  for (let i = 0; i < 2; i++) {
    particles.push(new Particle(i * 100, i * 20 + 100, 1));
  }
}

function draw() {
  background("black");
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      particles[i].collide(particles[j]);
    }
  }

  // Movement
  for (let particle of particles) {
    particle.edge();
    particle.update_pos();
    particle.draw();
  }
}
