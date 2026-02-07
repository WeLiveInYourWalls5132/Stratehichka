import { GameEngine } from './src/engine/game.js';
import { Renderer } from './src/ui/renderer.js';
import { Controls } from './src/ui/controls.js';
import { SimpleAI } from './src/ai/simple-ai.js';

class App {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.aiPlaying = false;

        // Initialize Core Components
        this.engine = new GameEngine();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.controls = new Controls(this.engine, this.renderer);
        this.ai = new SimpleAI(this.engine);

        this.init();
    }

    init() {
        // Resize canvas to fit container
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Start Game Loop
        this.gameLoop();

        console.log('Hexagon Strategy App Initialized');
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.renderer.updateCamera(); // Adjust view if needed
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Trigger AI if it's their turn and they are not already playing
        const state = this.engine.getState();
        if (state.currentPlayer === 'ai' && !this.aiPlaying) {
            this.aiPlaying = true;
            this.ai.playTurn().then(() => {
                this.aiPlaying = false;
            });
        }
    }

    render() {
        this.renderer.draw(this.engine.getState());
    }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new App();
});
