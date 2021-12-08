const c: HTMLCanvasElement = document.createElement("canvas");
const $: CanvasRenderingContext2D = c.getContext("2d");
const h = (c.height = document.body.clientHeight);
const w = (c.width = document.body.clientWidth);

const emojis = ["u1F384", "u1F31F", "u1F36C"];
const emojiImages = emojis.map((e) => {
  let img = new Image();
  img.src = `https://static.toss.im/2d-emojis/png/4x/${e}.png`;
  return img;
});

document.body.appendChild(c);

const GRAVITY = 0.02;

type BoundedRandomFun = (min: number, max: number) => number;

const randomFloat: BoundedRandomFun = (min, max) =>
  Math.random() * (max - min) + min;

const randomNumber: BoundedRandomFun = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const cleanFrame = (opacity: number) => {
  $.globalCompositeOperation = "destination-over";
  $.fillStyle = `rgba(255,255,255,${opacity})`;
  $.clearRect(0, 0, w, h);
  $.globalCompositeOperation = "lighter";
};

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: HTMLImageElement;
  size: number;
  alpha?: number | undefined;
  rotate: number;
}

class FireWork implements Dot {
  x!: number;
  y!: number;
  vx!: number;
  vy!: number;
  emoji: HTMLImageElement;
  size: number;
  alpha: number;
  rotate: number;

  constructor({ x, y, vx, vy, emoji, size, rotate = 0 }: Dot) {
    this.setPosition(x, y);
    this.setVelocity(vx, vy);

    this.emoji = emoji;
    this.size = size;
    this.alpha = 1;
    this.rotate = rotate;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setVelocity(vx: number, vy: number) {
    this.vx = vx;
    this.vy = vy;
  }

  update() {}

  render() {
    if (!this.emoji) return;
    $.save();
    $.translate(this.x, this.y);
    $.rotate(this.rotate);
    $.translate(-1 * this.x, -1 * this.y);
    $.globalAlpha = this.alpha;
    $.drawImage(this.emoji, this.x, this.y, this.size, this.size);
    $.restore();
  }
}

class ExplodingFireWork extends FireWork {
  exploded: boolean;
  explodePoint: any;

  constructor(options: any) {
    super(options);

    this.exploded = false;
    this.explodePoint = randomNumber(100, h / 2);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.y < h / 2) this.vy += GRAVITY;

    if (!this.exploded) {
      if (this.vy >= 0 || this.y < this.explodePoint) {
        explode(this);

        // this.alpha = 0;
        this.exploded = true;
      }
    }
  }
}

class FadingFireWork extends FireWork {
  rotateSign: number;

  constructor({ rotateSign = 1, ...options }: { rotateSign: number } & Dot) {
    super(options);

    this.rotateSign = rotateSign;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    this.vy += GRAVITY;
    this.rotate += this.rotateSign * GRAVITY * 0.5;

    if (this.alpha) {
      this.alpha -= 0.03;
    }
  }
}

class FireWorkDisplay {
  limit: number;
  fireworks: FireWork[];

  constructor(limit = 5) {
    this.limit = limit;
    this.fireworks = [];
  }

  add(firework: FireWork) {
    this.fireworks.push(firework);
  }

  remove(firework: FireWork) {
    this.fireworks = this.fireworks.filter((x) => x !== firework);
  }

  render() {
    this.fireworks.map((x) => x.render());
  }

  update() {
    this.fireworks.map((x) => {
      x.update();
      if (x.alpha <= 0) this.remove(x);
      if (x instanceof ExplodingFireWork && x.exploded) this.remove(x);
    });
  }
}

const STAGE = new FireWorkDisplay();

function igniteNewFireWork() {
  const firework: ExplodingFireWork = new ExplodingFireWork({
    x: randomNumber(w / 2 - 100, w / 2 + 100),
    y: h,
    vx: randomFloat(-1, 1),
    vy: randomFloat(2, 4) * -1,
    size: randomNumber(20, 40),
    emoji: emojiImages[randomNumber(0, emojis.length - 1)],
  });

  STAGE.add(firework);
}

function explode(firework: FireWork) {
  const embers = 10;
  const radius = 2;

  for (let i = 0; i < embers; ++i) {
    const ux = Math.cos((2 * Math.PI * i) / embers);
    const uy = Math.sin((2 * Math.PI * i) / embers);
    const ember = new FadingFireWork({
      ...firework.getPosition(),
      vx: radius * ux * randomFloat(0.5, 3),
      vy: radius * uy * randomFloat(0.5, 3),
      emoji: firework.emoji,
      size: firework.size / 2,
      rotate: Math.sign(ux) * randomFloat(0, Math.PI / 2),
      rotateSign: Math.sign(ux),
    });

    STAGE.add(ember);
  }
}

function draw() {
  requestAnimationFrame(draw);
  cleanFrame(0.1);

  if (
    STAGE.fireworks.filter((x) => x instanceof ExplodingFireWork && !x.exploded)
      .length < STAGE.limit
  ) {
    igniteNewFireWork();
  }

  STAGE.update();
  STAGE.render();
}

function startFireWorkDisplay() {
  $.clearRect(0, 0, w, h);

  draw();
}

startFireWorkDisplay();
