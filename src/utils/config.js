/**
 * Constants for Game Mechanics and UI
 */

export const CONFIG = {
    MAP: {
        RADIUS: 3, // Grid radius in hexes
        HEX_SIZE: 50, // Pixel size of a hex
        MIN_TERRITORIES: 15,
        MAX_TERRITORIES: 25
    },
    COLORS: {
        PLAYER: '#00d2ff',
        AI: '#ff416c',
        NEUTRAL: '#95a5a6',
        BACKGROUND: '#1a1c2c',
        SELECTION: '#f1c40f'
    },
    GAMEPLAY: {
        INITIAL_UNITS: 3,
        REINFORCEMENT_RATE: 3, // Units per 3 territories
        MIN_REINFORCEMENTS: 3
    }
};
