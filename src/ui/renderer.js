import { CONFIG } from '../utils/config.js';

/**
 * Handles Canvas rendering of the game state
 */
export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = { x: 0, y: 0, scale: 1 };
    }

    updateCamera() {
        // Center the map
        this.camera.x = this.canvas.width / 2;
        this.camera.y = this.canvas.height / 2;
    }

    draw(state) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.scale, this.camera.scale);

        // Draw Territories
        state.territories.forEach(t => {
            this.drawHex(t, state.selectedId === t.id);
        });

        this.ctx.restore();

        // Update DOM Stats
        this.updateDOM(state);
    }

    drawHex(territory, isSelected) {
        const size = CONFIG.MAP.HEX_SIZE - 2;
        const { x, y } = territory;

        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (Math.PI / 6); // Pointy top
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();

        // Fill color based on owner
        let color = CONFIG.COLORS.NEUTRAL;
        if (territory.owner === 'player') color = CONFIG.COLORS.PLAYER;
        if (territory.owner === 'ai') color = CONFIG.COLORS.AI;

        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.8;
        this.ctx.fill();

        // Selection highlight
        if (isSelected) {
            this.ctx.strokeStyle = CONFIG.COLORS.SELECTION;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Draw unit count
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = territory.owner === 'ai' ? '#fff' : '#000';
        this.ctx.font = 'bold 16px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(territory.units, x, y);
    }

    updateDOM(state) {
        document.getElementById('turn-count').innerText = state.turn;
        document.getElementById('player-territories').innerText = state.territories.filter(t => t.owner === 'player').length;
        document.getElementById('ai-territories').innerText = state.territories.filter(t => t.owner === 'ai').length;

        const reinPanel = document.getElementById('reinforcement-panel');
        document.getElementById('reinforcement-count').innerText = state.reinforcementsAvailable;

        if (state.phase === 'reinforce') {
            reinPanel.classList.remove('hidden');
        } else {
            reinPanel.classList.add('hidden');
        }

        // Update Log
        const logContainer = document.getElementById('game-log');
        logContainer.innerHTML = state.logs.map(log => `<div class="log-entry">${log}</div>`).join('');
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.camera.x) / this.camera.scale,
            y: (sy - this.camera.y) / this.camera.scale
        };
    }
}
