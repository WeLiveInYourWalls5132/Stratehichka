/**
 * Hexagonal Math and Coordinate Utilities
 * Using Cube/Axial coordinate system
 */

export class HexMath {
    /**
     * Converts axial (q, r) to pixel coordinates (x, y)
     */
    static axialToPixel(q, r, size) {
        const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = size * (3 / 2 * r);
        return { x, y };
    }

    /**
     * Gets axial coordinates of neighbors
     */
    static getNeighbors(q, r) {
        const directions = [
            [+1, 0], [+1, -1], [0, -1],
            [-1, 0], [-1, +1], [0, +1]
        ];
        return directions.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }

    /**
     * Simple distance between two hexes
     */
    static distance(a, b) {
        return (Math.abs(a.q - b.q)
            + Math.abs(a.q + a.r - b.q - b.r)
            + Math.abs(a.r - b.r)) / 2;
    }
}
