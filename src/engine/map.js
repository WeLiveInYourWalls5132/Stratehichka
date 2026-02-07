import { CONFIG } from '../utils/config.js';
import { HexMath } from '../utils/hex-math.js';

/**
 * Handles hexagonal map generation and adjacency
 */
export class MapGenerator {
    static generate() {
        const territories = [];
        const radius = CONFIG.MAP.RADIUS;
        let idCounter = 0;

        // Generate a basic hexagon grid (axial coordinates)
        for (let q = -radius; q <= radius; q++) {
            let r1 = Math.max(-radius, -q - radius);
            let r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                const pixel = HexMath.axialToPixel(q, r, CONFIG.MAP.HEX_SIZE);

                territories.push({
                    id: idCounter++,
                    q, r,
                    x: pixel.x,
                    y: pixel.y,
                    owner: 'neutral',
                    units: Math.floor(Math.random() * 3) + 2, // 2-4 units for neutral
                    neighbors: [] // Filled in later
                });
            }
        }

        // Calculate Adjacency
        territories.forEach(t => {
            const neighborsCoords = HexMath.getNeighbors(t.q, t.r);
            neighborsCoords.forEach(nc => {
                const neighbor = territories.find(other => other.q === nc.q && other.r === nc.r);
                if (neighbor) {
                    t.neighbors.push(neighbor.id);
                }
            });
        });

        // initial assignment
        this.assignInitialTerritories(territories);

        return territories;
    }

    static assignInitialTerritories(territories) {
        // Find extreme ends for Player and AI
        const sortedByQ = [...territories].sort((a, b) => a.q - b.q);

        const playerStart = sortedByQ[0];
        const aiStart = sortedByQ[sortedByQ.length - 1];

        playerStart.owner = 'player';
        playerStart.units = 5;

        aiStart.owner = 'ai';
        aiStart.units = 5;
    }
}
