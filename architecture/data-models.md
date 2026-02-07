# Data Models: Hexagon Strategy Game

## Territory
Represents a single hexagonal region on the map.
```typescript
interface Territory {
    id: number;
    owner: 'player' | 'ai' | 'neutral';
    units: number;
    neighbors: number[]; // IDs of adjacent territories
    center: { x: number, y: number }; // For rendering
    q: number; // Hex coordinate q
    r: number; // Hex coordinate r
}
```

## GameState
The root object for persistent and runtime data.
```typescript
interface GameState {
    turn: number;
    phase: 'reinforce' | 'attack' | 'move' | 'end';
    currentPlayer: 'player' | 'ai';
    territories: Territory[];
    selectedTerritoryId: number | null;
    targetTerritoryId: number | null;
    logs: string[];
}
```

## Persistence
State is serialized to JSON and stored in `localStorage` under the key `hexagon_strategy_save`.
