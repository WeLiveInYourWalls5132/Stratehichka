import { HexMath } from '../utils/hex-math.js';
import { CONFIG } from '../utils/config.js';

/**
 * Handles user input and UI interactions
 */
export class Controls {
    constructor(engine, renderer) {
        this.engine = engine;
        this.renderer = renderer;
        this.canvas = renderer.canvas;

        this.initEventListeners();
    }

    initEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        document.getElementById('btn-end-turn').addEventListener('click', () => {
            if (this.engine.getState().currentPlayer === 'player') {
                this.engine.nextTurn();
                // We'll trigger AI here in the future
            }
        });

        document.getElementById('btn-new-game').addEventListener('click', () => {
            location.reload();
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        // Convert screen to world coordinates
        const worldPos = this.renderer.screenToWorld(sx, sy);

        // Find clicked hex
        const territory = this.findTerritoryAt(worldPos.x, worldPos.y);

        if (territory) {
            this.engine.selectTerritory(territory.id);
            this.updateSelectionUI(territory);
        } else {
            this.engine.state.selectedId = null;
            document.getElementById('selection-info').classList.add('hidden');
        }
    }

    findTerritoryAt(x, y) {
        return this.engine.getState().territories.find(t => {
            const dist = Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2);
            return dist < CONFIG.MAP.HEX_SIZE * 0.8; // Slightly smaller radius for click detection
        });
    }

    updateSelectionUI(territory) {
        const info = document.getElementById('selection-info');
        const name = document.getElementById('territory-name');
        const units = document.getElementById('army-count');

        info.classList.remove('hidden');
        name.innerText = `Територія #${territory.id}`;
        units.innerText = territory.units;
    }
}
