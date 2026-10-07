class particle {
  constructor(charge, color, mass, x = windowWidth / 2, y = windowHeight / 2) {
    this.charge = charge;
    this.color = color;
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.mass = mass;
    this.size = this.scale_value(mass);
  }
  scale_value(v, base = 20, scale = 5) {
    return base + Math.log(v + 1) * scale;
  }
  draw() {
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.size);
  }
  calculate_vel(v1, v2, m1, m2) {
    return (v1 * (m1 - m2)) / (m1 + m2) + (v2 * (m2 * 2)) / (m1 + m2);
  }
  calculate_collision(Ep) {
    let v1 = this.vel;
    let v2 = Ep.vel;
    let m1 = this.mass;
    let m2 = Ep.mass;
    v1x = this.calculate_vel(v1.x, v2.x, m1, m2);
    v1y = this.calculate_vel(v1.y, v2.y, m1, m2);
    return createVector(v1x, v1y);
  }
  edge() {
    if (this.pos.x > width - this.size) {
      this.pos.x = width - this.size;
      this.vel.x *= -1;
    } else if (this.pos.x < this.size) {
      this.pos.x = this.size;
      this.vel.x *= -1;
    }
    if (this.pos.y > height - this.size) {
      this.pos.y = height - this.size;
      this.vel.y *= -1;
    } else if (this.pos.y < this.size) {
      this.pos.y = this.size;
      this.vel.y *= -1;
    }
  }
  charge_affect(Ep) {
    let dir = p5.Vector.sub(Ep.pos, this.pos);
    let dist = dir.mag();
    dist -= this.size / 2 + Ep.size / 2;
    if (dist < Ep.size + this.size) {
      let temp = this.calculate_vel(this, Ep).values;
    }
    let force = k * ((this.charge * Ep.charge) / dist ** 2);

    dir.normalize();
    dir.mult(force);

    this.vel.add(dir);

    this.pos.sub(this.vel);
    this.edge();
  }
}
let particles;
let pos;
let neg;
let k;
function setup() {
  createCanvas(windowWidth, windowHeight);

  k = 1;
  let charge_list = [1, 1, -1, -0.1];
  particles = [];
  for (let i in charge_list) {
    let charge = charge_list[i];
    let color = charge > 0 ? "red" : charge < 0 ? "blue" : "green";
    let mass = charge > 0 ? 1836 : charge < 0 ? 1 : 1839;
    let part = new particle(
      charge,
      color,
      mass,
      i * 100 + 1000,
      i * 10 + windowHeight / 2 - 20,
    );
    particles.push(part);
  }
}
function draw() {
  background("black");
  for (let i in particles) {
    particles[i].draw();
  }

  for (let i in particles) {
    for (let j in particles) {
      particles[i].charge_affect(particles[j]);
    }
  }
}
