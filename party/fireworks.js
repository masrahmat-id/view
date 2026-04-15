class Firework {
    constructor(canvasWidth, canvasHeight) {
        this.canvas = {
            width: canvasWidth,
            height: canvasHeight
        };
        this.x = Math.random() * canvasWidth;
        this.y = canvasHeight;
        this.targetX = Math.random() * canvasWidth;
        this.targetY = Math.random() * (canvasHeight / 2) + 100;
        this.trail = [];
        this.trailLength = 10;
        this.speed = {
            x: (this.targetX - this.x) / 50,
            y: (this.targetY - this.y) / 50
        };
        this.particles = [];
        this.exploded = false;
        this.colors = [
            '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#FF00FF', '#00FFFF',
            '#FFA500', '#FF1493', '#7FFF00',
            '#FF69B4', '#FFD700', '#FF4500',
            '#9400D3', '#00FA9A', '#FF1493'
        ];
        this.currentColor = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    // Fungsi untuk mendapatkan koordinat dari teks
    getTextPoints(text, fontSize) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 200;

        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const points = [];
        const step = 4; 

        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const index = (y * canvas.width + x) * 4;
                if (imageData[index] > 128) {
                    points.push({
                        x: x - canvas.width / 2,
                        y: y - canvas.height / 2
                    });
                }
            }
        }
        return points;
    }

    createHeartParticles() {
        // 1. Ledakan awal (Flash)
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 5 + Math.random() * 5;
            const life = 30 + Math.random() * 10;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: '#FFFFFF',
                alpha: 1,
                life: life,
                maxLife: life,
                size: 2,
                isExplosion: true
            });
        }

        // 2. Partikel Teks "LOVE YOU"
        const textPoints = this.getTextPoints("LOVE YOU", 50);
        const textColor = this.currentColor;

        textPoints.forEach(point => {
            this.particles.push({
                x: this.x,
                y: this.y,
                targetX: this.x + point.x,
                targetY: this.y + point.y,
                color: textColor,
                alpha: 0,
                life: 200 + Math.random() * 50,
                size: 1.8,
                speed: 5 + Math.random() * 3,
                delay: 5 + Math.random() * 15,
                isExplosion: false
            });
        });

        // 3. Partikel Bentuk Hati (Kiri & Kanan)
        const heartOffsets = [{dx: -180, dy: 0}, {dx: 180, dy: 0}];
        heartOffsets.forEach(offset => {
            const heartColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            for (let i = 0; i < 360; i += 6) {
                const rad = (i * Math.PI) / 180;
                const size = 6;
                const hX = size * (16 * Math.pow(Math.sin(rad), 3));
                const hY = -size * (13 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad));

                this.particles.push({
                    x: this.x,
                    y: this.y,
                    targetX: this.x + hX + offset.dx,
                    targetY: this.y + hY + offset.dy,
                    color: heartColor,
                    alpha: 0,
                    life: 180 + Math.random() * 20,
                    size: 1.5,
                    speed: 4 + Math.random() * 2,
                    delay: 20 + Math.random() * 20,
                    isExplosion: false
                });
            }
        });
    }

    update(ctx) {
        if (!this.exploded) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) this.trail.shift();

            this.x += this.speed.x;
            this.y += this.speed.y;

            if (Math.abs(this.y - this.targetY) < 5) {
                this.exploded = true;
                this.createHeartParticles();
            }

            this.trail.forEach((pos, index) => {
                const alpha = (index / this.trailLength) * 0.5;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();
            });

            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.currentColor;
            ctx.fill();
            return true;
        } else {
            this.particles.forEach(p => {
                if (p.delay > 0) {
                    p.delay--;
                    return;
                }

                if (p.isExplosion) {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.2;
                    p.vx *= 0.98;
                    p.life--;
                    p.alpha = (p.life / p.maxLife) * 0.8;
                } else {
                    if (p.alpha < 1) p.alpha += 0.05;
                    const dx = p.targetX - p.x;
                    const dy = p.targetY - p.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 1) {
                        p.x += (dx / distance) * p.speed;
                        p.y += (dy / distance) * p.speed;
                    }
                    p.life--;
                    if (p.life < 30) p.alpha *= 0.9;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.restore();
            });

            this.particles = this.particles.filter(p => p.life > 0);
            return this.particles.length > 0;
        }
    }
}

class FireworkShow {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.fireworks = [];
        this.lastLaunch = 0;
        this.launchInterval = 1200;
        this.countdown = 5;
        this.countdownStarted = false;

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    drawCountdown() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FF1493';
        this.ctx.font = 'bold 150px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.countdown, this.canvas.width / 2, this.canvas.height / 2);
    }

    startCountdown() {
        this.countdownStarted = true;
        const countdownInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown <= 0) {
                clearInterval(countdownInterval);
                this.start();
            }
        }, 1000);

        const animateCD = () => {
            if (this.countdown > 0) {
                this.drawCountdown();
                requestAnimationFrame(animateCD);
            }
        };
        animateCD();
    }

    launch() {
        const now = Date.now();
        if (now - this.lastLaunch > this.launchInterval) {
            this.fireworks.push(new Firework(this.canvas.width, this.canvas.height));
            this.lastLaunch = now;
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.launch();
        this.fireworks = this.fireworks.filter(fw => fw.update(this.ctx));

        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.animate();
    }
}

window.onload = () => {
    const show = new FireworkShow('canvas');
    show.startCountdown();
};
