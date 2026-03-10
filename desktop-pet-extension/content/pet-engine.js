(function () {
  class DesktopPetEngine {
    constructor(canvas, profile) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = canvas.width;
      this.height = canvas.height;

      this.profile = profile;
      this.texture = null;

      this.running = false;
      this.paused = false;
      this.toyMode = false;

      this.lastTime = performance.now();
      this.rafId = null;

      this.gravity = 1800;
      this.groundY = this.height - 20;

      this.pet = {
        x: this.width * 0.5,
        y: this.groundY,
        vx: 0,
        vy: 0,
        flip: 1
      };

      this.pointer = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        active: false
      };

      this.state = "idle";
      this.stateTimer = 1.1;
      this.walkSpeed = 165;
      this.jumpImpulse = 620;
      this.clock = 0;
      this.pendingJump = false;
    }

    async init() {
      await this.loadProfile(this.profile);
      this.start();
    }

    async loadProfile(profile) {
      this.profile = profile;
      this.texture = null;

      if (!profile?.imageDataUrl) return;

      const image = await loadImage(profile.imageDataUrl);
      this.texture = image;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame((ts) => this.frame(ts));
    }

    stop() {
      this.running = false;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    setPaused(paused) {
      this.paused = paused;
    }

    setToyMode(enabled) {
      this.toyMode = enabled;
      if (!enabled) this.pointer.active = false;
    }

    onPointerMove(x, y) {
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.active = true;
    }

    onCanvasClick(x, y) {
      const bounds = this.getPetBounds();
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        this.pendingJump = true;
      }
    }

    resize(width, height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.width = width;
      this.height = height;
      this.groundY = this.height - 20;
      this.pet.y = Math.min(this.pet.y, this.groundY);
    }

    frame(timestamp) {
      if (!this.running) return;

      const delta = Math.min((timestamp - this.lastTime) / 1000, 1 / 20);
      this.lastTime = timestamp;

      if (!this.paused) {
        this.update(delta);
      }
      this.render();

      this.rafId = requestAnimationFrame((ts) => this.frame(ts));
    }

    update(dt) {
      this.clock += dt;
      this.stateTimer -= dt;

      if (this.pendingJump && this.isOnGround()) {
        this.enterState("jump");
        this.pendingJump = false;
      }

      if (this.stateTimer <= 0) {
        this.pickNextState();
      }

      if (this.toyMode && this.pointer.active) {
        const offset = this.pointer.x - this.pet.x;
        this.pet.flip = offset >= 0 ? 1 : -1;
        if (Math.abs(offset) > 10) {
          this.pet.vx = Math.sign(offset) * this.walkSpeed * 1.18;
          if (this.isOnGround() && Math.random() < 0.012) {
            this.enterState("jump");
          } else {
            this.state = "walk";
          }
        } else {
          this.pet.vx *= 0.75;
          this.state = "idle";
        }
      } else {
        this.applyStateMotion();
      }

      this.pet.vy += this.gravity * dt;
      this.pet.x += this.pet.vx * dt;
      this.pet.y += this.pet.vy * dt;

      const minX = 30;
      const maxX = this.width - 30;
      if (this.pet.x < minX) {
        this.pet.x = minX;
        this.pet.vx = Math.abs(this.pet.vx) * 0.4;
        this.pet.flip = 1;
      } else if (this.pet.x > maxX) {
        this.pet.x = maxX;
        this.pet.vx = -Math.abs(this.pet.vx) * 0.4;
        this.pet.flip = -1;
      }

      if (this.pet.y > this.groundY) {
        this.pet.y = this.groundY;
        this.pet.vy = 0;
        if (this.state === "jump") {
          this.enterState(Math.random() < 0.7 ? "walk" : "idle");
        }
      }
    }

    applyStateMotion() {
      if (this.state === "idle") {
        this.pet.vx *= 0.9;
        return;
      }

      if (this.state === "walk") {
        this.pet.vx = this.pet.flip * this.walkSpeed;
        return;
      }

      if (this.state === "jump" && this.isOnGround()) {
        this.pet.vy = -this.jumpImpulse;
        this.pet.vx = this.pet.flip * this.walkSpeed * 0.55;
      }
    }

    pickNextState() {
      if (!this.isOnGround()) return;

      const random = Math.random();
      if (random < 0.48) {
        this.enterState("idle");
        return;
      }

      if (random < 0.86) {
        this.pet.flip = Math.random() > 0.5 ? 1 : -1;
        this.enterState("walk");
        return;
      }

      this.enterState("jump");
    }

    enterState(state) {
      this.state = state;
      if (state === "idle") {
        this.stateTimer = this.randomRange(0.8, 2.1);
        return;
      }
      if (state === "walk") {
        this.stateTimer = this.randomRange(1.2, 3.0);
        return;
      }
      this.stateTimer = this.randomRange(0.25, 0.65);
    }

    isOnGround() {
      return this.pet.y >= this.groundY - 0.1;
    }

    getPetBounds() {
      const size = this.computeDrawSize();
      return {
        left: this.pet.x - size.w * 0.5,
        right: this.pet.x + size.w * 0.5,
        top: this.pet.y - size.h,
        bottom: this.pet.y
      };
    }

    computeDrawSize() {
      if (!this.texture) {
        return { w: 88, h: 88 };
      }
      const maxH = 92;
      const scale = maxH / this.texture.height;
      return {
        w: this.texture.width * scale,
        h: this.texture.height * scale
      };
    }

    render() {
      const ctx = this.ctx;
      const { w, h } = this.computeDrawSize();

      ctx.clearRect(0, 0, this.width, this.height);

      if (this.toyMode && this.pointer.active) {
        ctx.beginPath();
        ctx.fillStyle = "#f59e0b";
        ctx.arc(this.pointer.x, this.pointer.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      const shadowScale = this.isOnGround() ? 1 : 0.55;
      ctx.save();
      ctx.translate(this.pet.x, this.groundY + 1);
      ctx.scale(shadowScale, shadowScale);
      ctx.fillStyle = "rgba(15, 23, 42, 0.24)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!this.texture) {
        ctx.fillStyle = "#0ea5e9";
        ctx.beginPath();
        ctx.arc(this.pet.x, this.pet.y - 44, 36, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      const bob = this.state === "walk" ? Math.sin(this.clock * 15) * 2.4 : Math.sin(this.clock * 6) * 1.2;
      const stretchX = this.state === "jump" ? 1.08 : 1;
      const stretchY = this.state === "jump" ? 0.92 : 1;
      const tilt = this.state === "walk" ? Math.sin(this.clock * 12) * 0.05 : 0;

      ctx.save();
      ctx.translate(this.pet.x, this.pet.y + bob);
      ctx.scale(this.pet.flip * stretchX, stretchY);
      ctx.rotate(this.pet.flip * tilt);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.texture, -w / 2, -h, w, h);
      ctx.restore();
    }

    randomRange(min, max) {
      return min + Math.random() * (max - min);
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Cannot decode pet image."));
      image.src = src;
    });
  }

  window.DesktopPetEngine = DesktopPetEngine;
})();
