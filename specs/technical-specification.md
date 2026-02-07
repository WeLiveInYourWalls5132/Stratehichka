# Technical Specification: Hexagon Strategy Game

## 1. Technology Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Rendering:** HTML5 Canvas (Pointy-Topped Hexagon Grid).
- **State Management:** Single object representing the game state (territories, turn, logs).
- **Persistence:** JSON serialization to `localStorage`.

## 2. Data Models
### Territory
```javascript
{
    id: Number,
    owner: 'player' | 'ai' | 'neutral',
    units: Number,
    neighbors: Array<Number>, // IDs of adjacent hexes
    x: Number, // Canvas coordinate
    y: Number  // Canvas coordinate
}
```

### GameState
```javascript
{
    turn: Number,
    currentPlayer: 'player' | 'ai',
    territories: Array<Territory>,
    status: 'ongoing' | 'won' | 'lost'
}
```

## 3. Core Components
- **MapGenerator:** Generates a random layout of 15-25 hexes.
- **Renderer:** Draws hexes, unit counts, and UI overlays.
- **CombatEngine:** Handles dice rolls and unit subtraction.
- **AIEngine:** Determines AI moves.
- **GameLoop:** Manages turn transitions and user input.

## 4. UI Layout
- **Top Bar:** Turn counter, Territory count, Reinforcements available.
- **Main Area:** Canvas with the hex map.
- **Bottom Bar:** Action buttons (Attack, Move, End Turn).

## 5. Performance
- Efficient hex rendering using a single canvas.
- No heavy frameworks to ensure fast loading on mobile.
