# Technical Specification: Hexagon Strategy Game (v1.2)

## 1. Technology Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES2020+)
- **Rendering:** HTML5 Canvas (pointy-top hexagon grid, axial coordinates)
- **Шрифти:** Google Fonts — Inter 400/700, Outfit 500/800
- **Залежності:** Відсутні (zero dependencies)
- **Збірка:** Відсутня — пряме підключення `game.js` у `<script>`

---

## 2. Архітектура файлів

### Активна версія (portable bundle)
```
game.js          ← Єдиний файл із усією логікою (1370 рядків)
index.html       ← Структура UI + підключення game.js
style.css        ← Всі стилі (glassmorphism sidebar, animations)
```

### Модульна версія (не використовується в production)
```
app.js                  ← Entry point (ES modules)
src/
  ai/simple-ai.js       ← Старий простий ШІ (замінений у бандлі)
  engine/game.js        ← Старий рушій (замінений у бандлі)
  engine/map.js         ← MapGenerator
  ui/renderer.js        ← Renderer
  ui/controls.js        ← Controls
  utils/config.js       ← CONFIG
  utils/hex-math.js     ← HexMath
```

---

## 3. Класи та компоненти (game.js)

### `CONFIG`
Глобальний об'єкт з налаштуваннями:
- `MAP.RADIUS = 3` — радіус карти
- `MAP.HEX_SIZE = 50` — розмір гексу в пікселях
- `GAMEPLAY.REINFORCEMENT_RATE = 3` — 1 військо / 3 territory
- `GAMEPLAY.MIN_REINFORCEMENTS = 3`
- `COLORS` — палітра кольорів

### `Particle` / `ParticleEngine`
Система частинок із підтримкою типів `circle` та `square`.
- `createExplosion(x, y, color, count=30)` — вибух при атаці
- `createTrail(x, y, color, count=5)` — слід при переміщенні
- `createVictoryConfetti(x, y, count=100)` — конфетті при перемозі
- `createSparkles(x, y, color, count=10)` — іскри під час руху

### `HexMath`
- `axialToPixel(q, r, size)` → `{x, y}` — конвертація координат
- `getNeighbors(q, r)` → масив 6 сусідніх координат

### `MapGenerator`
- `generate()` → `Territory[]` — генерує гексагональну карту радіуса 3, розставляє стартових гравців

### `GameEngine`
Центральний рушій керує станом гри.

**Стан (`this.state`):**
```javascript
{
  turn: Number,
  currentPlayer: 'player' | 'ai',
  phase: 'reinforce' | 'attack',
  territories: Territory[],
  selectedId: Number | null,
  reinforcementsAvailable: Number,
  animations: Animation[],
  logs: String[],            // до 50 записів
  status: 'ongoing' | 'won' | 'lost',
  difficulty: String,
  statistics: { player: Stats, ai: Stats, game: GameStats },
  moveHistory: MoveRecord[]  // до 50 записів
}
```

**Методи:**
| Метод | Опис |
|-------|------|
| `selectTerritory(id)` | Головна точка взаємодії — підсилення / вибір / атака / переміщення |
| `attack(source, target)` | d6 бій, оновлення статистики, перевірка перемоги |
| `move(source, target, troopCount)` | Переміщення N військ між своїми гексами |
| `checkWinCondition()` | Перевіряє статус `won`/`lost` |
| `nextTurn()` | Передає хід, обчислює підкріплення |
| `updateStatistics()` | Оновлює `largestArmy` для обох сторін |
| `log(msg)` | Додає повідомлення до журналу (FIFO 50) |
| `addToHistory(move)` | Додає запис до `moveHistory` (FIFO 50) |

### `DIFFICULTY_PRESETS`
Об'єкт з пресетами для 4 рівнів: `easy`, `normal`, `hard`, `expert`.

### `SimpleAI`
Людиноподібний ШІ з персональністю, пам'яттю та стратегіями.

**Ключові параметри (`personality`):**
- `aggression` — схильність атакувати
- `riskTolerance` — ризик при невигідних атаках
- `focusLevel` — точність вибору цілей (1.0 = ідеально)
- `patience` — чи робить менше дій за хід
- `thinkingMultiplier` — множник пауз між діями

**Методи:**
| Метод | Опис |
|-------|------|
| `playTurn()` | Async: пауза → стратегія → підсилення → атаки → кінець |
| `updateStrategy()` | Вибирає `expand`/`defend`/`aggress` |
| `handleReinforcements()` | Scored scoring для розподілу підкріплень |
| `performBestAction()` | Вибирає та виконує найкращу атаку або переміщення |
| `thinkingDelay(type)` | Повертає Promise з рандомізованою затримкою |

### `Renderer`
Малює стан гри на Canvas кожен кадр.

**Методи:**
| Метод | Опис |
|-------|------|
| `draw(state)` | Головний цикл: clear → hexes → animations → particles → DOM |
| `drawHex(t, isSelected)` | Рисує гекс: fill (з `fillSize+0.7` для усунення зазорів), flash, border, координати, одиниці |
| `drawAnimations(state)` | Анімує атаки (лінія + ring) та переміщення (куля + іскри) |
| `updateDOM(state)` | Оновлює HUD, журнал, moveHistory, game-over overlay |
| `updateCamera()` | Центрує камеру на canvas |

### `App`
Точка входу — ініціалізує компоненти, управляє ігровими станами.

**Стани:** `'menu'` | `'active'`

**Методи:**
| Метод | Опис |
|-------|------|
| `handleClick(e)` | Конвертує клік → hex координати → `selectTerritory` або `showTroopDialog` |
| `showTroopDialog(srcId, tgtId)` | Показує слайдер для переміщення; позиціонує відносно гексу |
| `confirmMove()` | Виконує `engine.move()` зі значенням слайдера |
| `startGame(difficulty)` | Реінітіалізує Engine та AI з обраною складністю |
| `loop()` | `requestAnimationFrame` — тригерить AI та рендер |

---

## 4. Моделі даних

### Territory
```typescript
{
  id: number;            // Унікальний ID
  q: number;             // Осьова координата q
  r: number;             // Осьова координата r
  x: number;             // Canvas координата X (центр)
  y: number;             // Canvas координата Y (центр)
  owner: 'player' | 'ai' | 'neutral';
  units: number;
  neighbors: number[];   // ID сусідніх гексів
  flash: number;         // Від 0 до 1 (fade-ефект)
}
```

### Animation
```typescript
{
  type: 'attack' | 'move';
  from: { x, y };
  to: { x, y };
  duration: number;    // 30 кадрів (атака), 20 (рух)
  life: number;        // Зменшується щокадру
  attacker?: 'player' | 'ai';  // Тільки для attack
}
```

### Statistics
```typescript
{
  attacks: number;
  successfulAttacks: number;
  territoriesConquered: number;
  territoriesLost: number;
  largestArmy: number;
  totalUnitsDeployed: number;
}
```

---

## 5. Рендеринг та продуктивність

- `fillSize = HEX_SIZE + 0.7` — усуває субпіксельні зазори між гексами
- DOM-оновлення (журнал) — тільки при зміні вмісту (порівняння `innerHTML`)
- Частинки видаляються з масиву при `life <= 0` (filter кожен кадр)
- Canvas ресайзиться при будь-якому `window.resize`

---

## 6. Відомі обмеження

| Обмеження | Опис |
|-----------|------|
| Збереження | `localStorage` не реалізований, стан не зберігається |
| Мобільна версія | Немає touch-обробників, тільки mouse click |
| Модульна версія | `src/` → `app.js` не підключені в `index.html` |
| Масштабування | Немає зуму/пану карти |
