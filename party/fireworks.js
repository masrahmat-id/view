class Firework {
    constructor(canvasWidth, canvasHeight) {
        this.canvas = {
            width: canvasWidth,
            height: canvasHeight
        };
        this.x = Math.random() * canvasWidth;
        this.y = canvasHeight;
        this.targetX = Math.random() * canvasWidth;
        this.targetY = Math.random() * (canvasHeight/2) + 100;
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
    
        createHeartParticles() {
            const heartCount = 2;
            const baseSize = 12;
        
            // Initial explosion burst with random colors
            for (let i = 0; i < 120; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = 8 + Math.random() * 6;
                const life = 40 + Math.random() * 20;
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    alpha: 1,
                    life: life,
                    maxLife: life,
                    size: 2 + Math.random() * 2,
                    isExplosion: true
                });
            }
        
            // Heart shapes with random colors
            for (let h = 0; h < heartCount; h++) {
                const angle = (Math.PI * 2 * h) / heartCount;
                const distance = 60 + Math.random() * 80;
                const heartX = this.x + Math.cos(angle) * distance;
                const heartY = this.y + Math.sin(angle) * distance;
                // Each heart gets a different random color
                const heartColor = this.colors[Math.floor(Math.random() * this.colors.length)];
                const heartSize = baseSize * (0.8 + Math.random() * 0.4);

                for (let i = 0; i < 360; i += 3) {
                    const rad = (i * Math.PI) / 180;
                    const heartShape = {
                        x: heartX + heartSize * (16 * Math.pow(Math.sin(rad), 3)),
                        y: heartY - heartSize * (13 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
                    };

                    // Each particle in the heart can have a random color variation
                    const particleColor = Math.random() > 0.8 ? 
                        this.colors[Math.floor(Math.random() * this.colors.length)] : 
                        heartColor;

                    this.particles.push({
                        x: this.x + (Math.random() - 0.5) * 50,
                        y: this.y + (Math.random() - 0.5) * 50,
                        targetX: heartShape.x,
                        targetY: heartShape.y,
                        color: particleColor,
                        alpha: 0,
                        life: 150 + Math.random() * 20,
                        size: 1.5,
                        speed: 6,
                        delay: Math.random() * 20
                    });
                }
            }
    }

    update(ctx) {
        if (!this.exploded) {
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }

            this.x += this.speed.x;
            this.y += this.speed.y;

            if (Math.abs(this.y - this.targetY) < 5) {
                this.exploded = true;
                this.createHeartParticles();
            }

            // Draw trail
            this.trail.forEach((pos, index) => {
                const alpha = (index / this.trailLength) * 0.5;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
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
                    
                    if (distance > 0.1) {
                        p.x += (dx / distance) * p.speed;
                        p.y += (dy / distance) * p.speed;
                    }
                    p.life--;
                    if (p.life < 30) p.alpha *= 0.9;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();

                // Add glow effect
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha * 0.3;
                ctx.fill();

                ctx.globalAlpha = 1;
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.fireworks = [];
        this.lastLaunch = 0;
        this.launchInterval = 1000;
        this.countdown = 10;
        this.countdownStarted = false;
    }

    drawCountdown() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 120px Arial';
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
        
        const animate = () => {
            if (this.countdown > 0) {
                this.drawCountdown();
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    launch() {
        const now = Date.now();
        if (now - this.lastLaunch > this.launchInterval) {
            this.fireworks.push(new Firework(this.canvas.width, this.canvas.height));
            this.lastLaunch = now;
        }
    }

    animate() {
        // Background dengan efek fade
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Launch new fireworks
        this.launch();

        // Update existing fireworks
        this.fireworks = this.fireworks.filter(firework => firework.update(this.ctx));

        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.animate();
    }
}

// Modified initialization
window.onload = () => {
    const show = new FireworkShow('canvas');
    show.startCountdown();
}