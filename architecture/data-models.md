# Data Models: Hexagon Strategy Game (v1.2)

## Territory
Один гексагональний регіон на карті.
```typescript
interface Territory {
  id: number;              // Унікальний автоінкрементний ID
  q: number;               // Осьова координата Q
  r: number;               // Осьова координата R
  x: number;               // Canvas X (центр, px)
  y: number;               // Canvas Y (центр, px)
  owner: 'player' | 'ai' | 'neutral';
  units: number;           // Кількість армій (≥ 1 для своїх)
  neighbors: number[];     // ID суміжних Territory
  flash: number;           // 0..1, зменшується -0.05/кадр
}
```

---

## GameState
Головний стан гри (зберігається в `GameEngine.state`).
```typescript
interface GameState {
  turn: number;                        // Поточний хід гравця
  currentPlayer: 'player' | 'ai';
  phase: 'reinforce' | 'attack';
  territories: Territory[];
  selectedId: number | null;           // ID вибраного гексу
  reinforcementsAvailable: number;     // Залишилось підкріплень
  animations: Animation[];             // Активні анімації
  logs: string[];                      // FIFO, max 50
  status: 'ongoing' | 'won' | 'lost';
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  statistics: GameStatistics;
  moveHistory: MoveRecord[];           // FIFO, max 50
}
```

---

## Animation
Тимчасовий об'єкт анімації (видаляється при `life <= 0`).
```typescript
interface Animation {
  type: 'attack' | 'move';
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration: number;   // Початкова тривалість кадрів (30=атака, 20=рух)
  life: number;       // Зменшується кожен кадр
  attacker?: 'player' | 'ai';  // Тільки для type='attack'
}
```

---

## Statistics
Відстежується окремо для кожного гравця.
```typescript
interface PlayerStats {
  attacks: number;
  successfulAttacks: number;
  territoriesConquered: number;
  territoriesLost: number;
  largestArmy: number;
  totalUnitsDeployed: number;
}

interface GameStats {
  totalTurns: number;
  startTime: number;   // Date.now()
  endTime: number | null;
}

interface GameStatistics {
  player: PlayerStats;
  ai: PlayerStats;
  game: GameStats;
}
```

---

## MoveRecord
Запис у `moveHistory` для журналу ходів.
```typescript
// Захоплення
{ type: 'conquest'; player: 'player'|'ai'; source: number; target: number; turn: number }

// Атака (з результатом)
{ type: 'attack'; player: 'player'|'ai'; source: number; target: number; result: 'damage'|'failed'; turn: number }

// Переміщення
{ type: 'move'; player: 'player'|'ai'; source: number; target: number; units: number; turn: number }
```

---

## AI Personality
Параметри рандомізованої особистості ШІ.
```typescript
interface AIPersonality {
  aggression: number;         // 0..1 — схильність атакувати
  riskTolerance: number;      // 0..1 — ризикованість
  focusLevel: number;         // 0..1 — точність рішень
  patience: boolean;          // Чи робить менше дій за хід
  thinkingMultiplier: number; // Множник затримок (0.3 Expert..1.5 Easy)
}
```

---

## AI Memory
Пам'ять ШІ про хід гри.
```typescript
interface AIMemory {
  playerLastAttackedFrom: number | null;  // ID гексу, звідки гравець атакував
  threatenedTerritories: number[];        // ID небезпечних гексів
  turnsWithoutPlayerAttack: number;
  totalTurns: number;
}
```

---

## CONFIG
Глобальна конфігурація гри.
```typescript
const CONFIG = {
  MAP: {
    RADIUS: 3,               // Радіус гексагральної сітки (37 гексів)
    HEX_SIZE: 50,            // Розмір гексу в пікселях
    MIN_TERRITORIES: 15,     // (legacy, не використовується)
    MAX_TERRITORIES: 25      // (legacy, не використовується)
  },
  COLORS: {
    PLAYER: '#00d2ff',
    AI: '#ff416c',
    NEUTRAL: '#95a5a6',
    BACKGROUND: '#1a1c2c',
    SELECTION: '#f1c40f',
    ATTACK: '#fff'
  },
  GAMEPLAY: {
    INITIAL_UNITS: 3,        // (legacy)
    REINFORCEMENT_RATE: 3,   // 1 підкріплення / 3 territory
    MIN_REINFORCEMENTS: 3    // Мінімум підкріплень за хід
  }
};
```

---

## Persistence
> ⚠️ `localStorage` в поточній версії **не реалізований**. Стан скидається при перезавантаженні сторінки.
