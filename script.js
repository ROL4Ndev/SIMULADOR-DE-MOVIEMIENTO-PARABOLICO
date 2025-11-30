// ========== SIMULADOR DE TIRO PARABÓLICO ==========

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let angle = 45;
let velocity = 25;
let gravity = 9.81;
let mass = 5;
let diameter = 0.1;
let dragCoefficient = 0.47;
let airResistance = false;
let targetPosition = 50;

let isRunning = false;
let isPaused = false;
let time = 0;
let trajectory = [];
let projectile = null;
let maxHeight = 0;
let finalVelocity = 0;

let attempts = 0;
let hits = 0;

const scale = 5;
const cannonX = 80;
let groundY;

function updateGroundY() {
    groundY = canvas.height - 60;
}

document.getElementById('angleInput').addEventListener('input', (e) => {
    angle = parseFloat(e.target.value) || 0;
    if (!isRunning) draw();
});


document.getElementById('velocityInput').addEventListener('input', (e) => {
    velocity = parseFloat(e.target.value) || 0;
});

document.getElementById('gravityInput').addEventListener('input', (e) => {
    gravity = parseFloat(e.target.value) || 0;
});

document.getElementById('massInput').addEventListener('input', (e) => {
    mass = parseFloat(e.target.value) || 0.1;
});

document.getElementById('diameterInput').addEventListener('input', (e) => {
    diameter = parseFloat(e.target.value) || 0.01;
});

document.getElementById('dragInput').addEventListener('input', (e) => {
    dragCoefficient = parseFloat(e.target.value) || 0;
});

document.getElementById('airResistance').addEventListener('change', (e) => {
    airResistance = e.target.checked;
    document.getElementById('dragInput').disabled = !airResistance;
});

document.getElementById('targetInput').addEventListener('input', (e) => {
    targetPosition = parseFloat(e.target.value) || 0;
    if (!isRunning) draw();
});

function moveTargetLeft() {
    targetPosition = Math.max(0, targetPosition - 5);
    document.getElementById('targetInput').value = targetPosition.toFixed(1);
    if (!isRunning) draw();
}

function moveTargetRight() {
    targetPosition += 5;
    document.getElementById('targetInput').value = targetPosition.toFixed(1);
    if (!isRunning) draw();
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('pauseBtn').addEventListener('click', pause);
document.getElementById('resetBtn').addEventListener('click', reset);

function start() {
    if (!isRunning) {
        isRunning = true;
        isPaused = false;
        time = 0;
        trajectory = [];
        maxHeight = 0;
        finalVelocity = 0;
        attempts++;
        updateStats();
        document.getElementById('statusInfo').textContent = 'En vuelo';
        document.getElementById('statusInfo').style.color = '#00d4ff';
        animate();
    } else if (isPaused) {
        isPaused = false;
        document.getElementById('statusInfo').textContent = 'En vuelo';
        document.getElementById('statusInfo').style.color = '#00d4ff';
        animate();
    }
}

function pause() {
    if (isRunning && !isPaused) {
        isPaused = true;
        document.getElementById('statusInfo').textContent = 'Pausado';
        document.getElementById('statusInfo').style.color = '#ffa500';
    }
}

function reset() {
    isRunning = false;
    isPaused = false;
    time = 0;
    trajectory = [];
    projectile = null;
    maxHeight = 0;
    finalVelocity = 0;
    document.getElementById('statusInfo').textContent = 'Listo';
    document.getElementById('statusInfo').style.color = '#00d4ff';
    document.getElementById('distanceInfo').textContent = '0.00 m';
    document.getElementById('maxHeightInfo').textContent = '0.00 m';
    document.getElementById('timeInfo').textContent = '0.00 s';
    document.getElementById('finalVelocityInfo').textContent = '0.00 m/s';
    document.getElementById('diffInfo').textContent = '0.00 m';
    draw();
}

function calculatePosition(t) {
    const angleRad = angle * Math.PI / 180;
    const vx0 = velocity * Math.cos(angleRad);
    const vy0 = velocity * Math.sin(angleRad);
    
    if (airResistance) {
        const rho = 1.225;
        const area = Math.PI * (diameter / 2) ** 2;
        const k = 0.5 * rho * dragCoefficient * area;
        const dt = 0.001;
        
        let x = 0, y = 0, vx = vx0, vy = vy0;
        
        for (let i = 0; i < t; i += dt) {
            const v = Math.sqrt(vx * vx + vy * vy);
            if (v === 0) break;
            const dragForce = k * v * v;
            const ax = -(dragForce / mass) * (vx / v);
            const ay = -gravity - (dragForce / mass) * (vy / v);
            
            vx += ax * dt;
            vy += ay * dt;
            x += vx * dt;
            y += vy * dt;
        }
        
        finalVelocity = Math.sqrt(vx * vx + vy * vy);
        return { x, y, vx, vy };
    } else {
        const x = vx0 * t;
        const y = vy0 * t - 0.5 * gravity * t * t;
        const vx = vx0;
        const vy = vy0 - gravity * t;
        
        finalVelocity = Math.sqrt(vx * vx + vy * vy);
        return { x, y, vx, vy };
    }
}

function draw() {
    updateGroundY();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (groundY - 100);
        const size = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#0f3d0f';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#00d4ff';
    ctx.font = '12px Arial';
    const maxDistance = Math.floor((canvas.width - cannonX) / scale);
    for (let i = 0; i <= maxDistance; i += 20) {
        const x = cannonX + i * scale;
        if (x < canvas.width) {
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, groundY - 5);
            ctx.lineTo(x, groundY + 5);
            ctx.stroke();
            ctx.fillText(i + 'm', x - 10, groundY + 20);
        }
    }
    
    drawCannon();
    drawTarget();
    
    if (trajectory.length > 1) {
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cannonX + trajectory[0].x * scale, groundY - trajectory[0].y * scale);
        for (let i = 1; i < trajectory.length; i++) {
            ctx.lineTo(cannonX + trajectory[i].x * scale, groundY - trajectory[i].y * scale);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
    }
    
    if (projectile && projectile.y >= 0) {
        const px = cannonX + projectile.x * scale;
        const py = groundY - projectile.y * scale;
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(px, py, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff8c00';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function drawCannon() {
    const angleRad = angle * Math.PI / 180;
    const cannonLength = 40;
    
    ctx.fillStyle = '#424242';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00d4ff';
    ctx.beginPath();
    ctx.arc(cannonX, groundY, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#616161';
    ctx.beginPath();
    ctx.arc(cannonX - 15, groundY + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cannonX + 15, groundY + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.save();
    ctx.translate(cannonX, groundY);
    ctx.rotate(-angleRad);
    
    ctx.fillStyle = '#757575';
    ctx.fillRect(0, -10, cannonLength, 20);
    
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -10, cannonLength, 20);
    
    ctx.fillStyle = '#424242';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff88';
    ctx.beginPath();
    ctx.arc(cannonLength, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

function drawTarget() {
    const targetX = cannonX + targetPosition * scale;

    if (targetX > canvas.width) return;

    // 🎯 Dibujar el objetivo como elipse (pintado en el suelo)
    const rings = [
        { radiusX: 25, radiusY: 10, color: '#ff0000' },
        { radiusX: 20, radiusY: 8,  color: '#ffffff' },
        { radiusX: 15, radiusY: 6,  color: '#ff0000' },
        { radiusX: 10, radiusY: 4,  color: '#ffffff' },
        { radiusX: 5,  radiusY: 2,  color: '#ff0000' }
    ];

    rings.forEach(ring => {
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.ellipse(
            targetX,     // centro X
            groundY,     // en el suelo
            ring.radiusX,
            ring.radiusY,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}



function animate() {
    if (!isRunning || isPaused) return;
    
    time += 0.03;
    const pos = calculatePosition(time);
    
    if (pos.y < 0) {
        isRunning = false;
        const finalDistance = pos.x;
        const difference = Math.abs(finalDistance - targetPosition);
        
        if (difference < 2) {
            hits++;
            document.getElementById('statusInfo').textContent = '🎯 ¡ACIERTO!';
            document.getElementById('statusInfo').style.color = '#00ff88';
        } else {
            document.getElementById('statusInfo').textContent = '❌ Fallaste';
            document.getElementById('statusInfo').style.color = '#ff4757';
        }
        
        updateStats();
        document.getElementById('distanceInfo').textContent = finalDistance.toFixed(2) + ' m';
        document.getElementById('maxHeightInfo').textContent = maxHeight.toFixed(2) + ' m';
        document.getElementById('timeInfo').textContent = time.toFixed(2) + ' s';
        document.getElementById('finalVelocityInfo').textContent = finalVelocity.toFixed(2) + ' m/s';
        document.getElementById('diffInfo').textContent = difference.toFixed(2) + ' m';
        return;
    }
    
    trajectory.push(pos);
    projectile = pos;
    
    if (pos.y > maxHeight) {
        maxHeight = pos.y;
    }
    
    document.getElementById('distanceInfo').textContent = pos.x.toFixed(2) + ' m';
    document.getElementById('maxHeightInfo').textContent = maxHeight.toFixed(2) + ' m';
    document.getElementById('timeInfo').textContent = time.toFixed(2) + ' s';
    document.getElementById('finalVelocityInfo').textContent = finalVelocity.toFixed(2) + ' m/s';
    
    draw();
    requestAnimationFrame(animate);
}

function updateStats() {
    document.getElementById('attemptsInfo').textContent = attempts;
    document.getElementById('hitsInfo').textContent = hits;
    const accuracy = attempts > 0 ? ((hits / attempts) * 100).toFixed(1) : 0;
    document.getElementById('accuracyInfo').textContent = accuracy + '%';
}

// Inicialización
draw();