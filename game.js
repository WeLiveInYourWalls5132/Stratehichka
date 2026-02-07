/**
 * Hexagon Strategy Game - Portable Bundle
 * Updated with Animations and Improved Visuals
 */

// --- CONFIG ---
const CONFIG = {
    MAP: {
        RADIUS: 3,
        HEX_SIZE: 50,
        MIN_TERRITORIES: 15,
        MAX_TERRITORIES: 25
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
        INITIAL_UNITS: 3,
        REINFORCEMENT_RATE: 3,
        MIN_REINFORCEMENTS: 3
    }
};

// --- UTILS ---
class HexMath {
    static axialToPixel(q, r, size) {
        const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = size * (3 / 2 * r);
        return { x, y };
    }
    static getNeighbors(q, r) {
        const directions = [[+1, 0], [+1, -1], [0, -1], [-1, 0], [-1, +1], [0, +1]];
        return directions.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
    }
}

class MapGenerator {
    static generate() {
        const territories = [];
        const radius = CONFIG.MAP.RADIUS;
        let idCounter = 0;
        for (let q = -radius; q <= radius; q++) {
            let r1 = Math.max(-radius, -q - radius);
            let r2 = Math.min(radius, -q + radius);
            for (let r = r1; r <= r2; r++) {
                const pixel = HexMath.axialToPixel(q, r, CONFIG.MAP.HEX_SIZE);
                territories.push({
                    id: idCounter++, q, r, x: pixel.x, y: pixel.y,
                    owner: 'neutral', units: Math.floor(Math.random() * 3) + 2,
                    neighbors: [], flash: 0
                });
            }
        }
        territories.forEach(t => {
            const neighborsCoords = HexMath.getNeighbors(t.q, t.r);
            neighborsCoords.forEach(nc => {
                const neighbor = territories.find(other => other.q === nc.q && other.r === nc.r);
                if (neighbor) t.neighbors.push(neighbor.id);
            });
        });
        const sortedByQ = [...territories].sort((a, b) => a.q - b.q);
        sortedByQ[0].owner = 'player'; sortedByQ[0].units = 5;
        sortedByQ[sortedByQ.length - 1].owner = 'ai'; sortedByQ[sortedByQ.length - 1].units = 5;
        return territories;
    }
}

// --- ENGINE ---
class GameEngine {
    constructor() {
        this.state = {
            turn: 1, currentPlayer: 'player', phase: 'reinforce',
            territories: [], selectedId: null, reinforcementsAvailable: 0,
            animations: [],
            logs: ["Гра почалася! Гравці займають позиції."],
            status: 'ongoing'
        };
        this.init();
    }
    init() {
        this.state.territories = MapGenerator.generate();
        this.calculateReinforcements();
    }
    calculateReinforcements() {
        const count = this.state.territories.filter(t => t.owner === this.state.currentPlayer).length;
        this.state.reinforcementsAvailable = Math.max(CONFIG.GAMEPLAY.MIN_REINFORCEMENTS, Math.floor(count / CONFIG.GAMEPLAY.REINFORCEMENT_RATE));
    }
    selectTerritory(id) {
        if (this.state.status !== 'ongoing') return;
        const territory = this.state.territories.find(t => t.id === id);
        if (!territory) return;
        if (this.state.phase === 'reinforce') {
            if (territory.owner === this.state.currentPlayer && this.state.reinforcementsAvailable > 0) {
                territory.units++;
                territory.flash = 1; // Visual feedback
                this.state.reinforcementsAvailable--;
                if (this.state.reinforcementsAvailable === 0) {
                    this.state.phase = 'attack';
                    this.log("Фаза підкріплення завершена. Час атакувати!");
                }
            } else if (territory.owner === this.state.currentPlayer) {
                this.state.selectedId = id;
            }
        } else {
            if (this.state.selectedId === null) {
                if (territory.owner === this.state.currentPlayer && territory.units > 1) this.state.selectedId = id;
            } else if (this.state.selectedId === id) {
                this.state.selectedId = null;
            } else {
                const source = this.state.territories.find(t => t.id === this.state.selectedId);
                if (source.neighbors.includes(id)) {
                    if (territory.owner !== this.state.currentPlayer) this.attack(source, territory);
                    else this.move(source, territory);
                    this.state.selectedId = null;
                } else {
                    this.state.selectedId = id; // Switch selection if not a neighbor
                }
            }
        }
    }
    attack(source, target) {
        // Attack Animation
        this.state.animations.push({
            type: 'attack',
            from: { x: source.x, y: source.y },
            to: { x: target.x, y: target.y },
            duration: 30, // frames
            life: 30
        });

        const attackRoll = Math.floor(Math.random() * 6) + 1;
        const defenseRoll = Math.floor(Math.random() * 6) + 1;

        target.flash = 1; // Flash regardless of outcome

        if (attackRoll > defenseRoll) {
            target.units--;
            if (target.units <= 0) {
                target.owner = source.owner;
                target.units = source.units - 1;
                source.units = 1;
                this.log(`Перемога на терит. ${target.id}!`);
                this.checkWinCondition();
            }
        } else {
            source.units--;
            source.flash = 1;
            this.log(`Атака на ${target.id} відбита!`);
        }
    }

    checkWinCondition() {
        const playerTerrs = this.state.territories.filter(t => t.owner === 'player').length;
        const aiTerrs = this.state.territories.filter(t => t.owner === 'ai').length;
        const total = this.state.territories.length;

        if (playerTerrs === total) {
            this.state.status = 'won';
            this.log("ВІТАЄМО! Ви захопили весь світ!");
        } else if (aiTerrs === total || playerTerrs === 0) {
            this.state.status = 'lost';
            this.log("ПОРАЗКА. ШІ встановив новий світовий порядок.");
        }
    }
    /**
     * Move troops from source to target territory
     * @param {Object} source - Source territory
     * @param {Object} target - Target territory
     * @param {number} troopCount - Number of troops to move (optional, defaults to all but 1)
     */
    move(source, target, troopCount = null) {
        this.state.animations.push({
            type: 'move',
            from: { x: source.x, y: source.y },
            to: { x: target.x, y: target.y },
            duration: 20,
            life: 20
        });

        // If troopCount not specified, move all but 1
        const toMove = troopCount !== null ? troopCount : (source.units - 1);

        // Validation: ensure at least 1 troop remains and we have enough troops
        if (toMove > 0 && toMove < source.units) {
            target.units += toMove;
            source.units -= toMove;
            this.log(`Переміщено ${toMove} військ до терит. ${target.id}`);
        } else {
            this.log(`Помилка: неможливо перемістити ${toMove} військ`);
        }
    }
    nextTurn() {
        if (this.state.status !== 'ongoing') return;
        this.state.currentPlayer = this.state.currentPlayer === 'player' ? 'ai' : 'player';
        if (this.state.currentPlayer === 'player') this.state.turn++;
        this.state.phase = 'reinforce';
        this.state.selectedId = null;
        this.calculateReinforcements();
        this.log(`Хід ${this.state.turn}: Черга ${this.state.currentPlayer === 'player' ? 'Гравця' : 'ШІ'}`);
    }
    log(msg) {
        this.state.logs.unshift(msg);
        if (this.state.logs.length > 5) this.state.logs.pop();
    }
}

// --- AI ---
/**
 * Human-Like AI - поводиться більш природньо та непередбачувано
 * 
 * Ключові особливості:
 * - Персональність (агресія, ризикованість, терплячість)
 * - Пам'ять про дії гравця
 * - Імітація помилок та "сліпих плям"  
 * - Перемикання між стратегіями
 * - Варіативні затримки "роздумів"
 */
class SimpleAI {
    constructor(engine) {
        this.engine = engine;

        // Унікальна персональність для кожної гри
        this.personality = {
            aggression: 0.3 + Math.random() * 0.5,      // 0.3-0.8: схильність атакувати
            riskTolerance: 0.2 + Math.random() * 0.5,   // 0.2-0.7: готовність до ризику
            patience: Math.random() > 0.4,              // чекати підсилень чи атакувати відразу
            focusLevel: 0.7 + Math.random() * 0.25      // 0.7-0.95: шанс помітити найкращий хід
        };

        // Пам'ять про гру
        this.memory = {
            playerLastAttackedFrom: null,    // звідки гравець атакував
            threatenedTerritories: [],       // наші території під загрозою
            turnsWithoutPlayerAttack: 0,     // скільки ходів гравець не атакував
            totalTurns: 0                    // загальна кількість ходів
        };

        // Поточна стратегія: 'expand', 'defend', 'aggress'
        this.currentStrategy = 'expand';

        this.engine.log(`ШІ: ${this.personality.patience ? 'терплячий' : 'імпульсивний'} стиль`);
    }

    /**
     * Головний метод ходу AI
     */
    async playTurn() {
        if (this.engine.state.currentPlayer !== 'ai' || this.engine.state.status !== 'ongoing') return;

        this.memory.totalTurns++;

        // "Думаємо" перед ходом (людська пауза)
        await this.thinkingDelay('start');

        // Оновлюємо стратегію на основі ситуації
        this.updateStrategy();

        // --- 1. Reinforcement Phase ---
        await this.handleReinforcements();

        // --- 2. Action Phase ---
        let actionsTaken = 0;
        const maxActions = this.personality.patience ? 15 : 25; // Терплячий AI робить менше дій
        let lastActionCount = -1;

        // Іноді AI "втомлюється" і робить менше дій
        const fatigueChance = Math.min(0.3, this.memory.totalTurns * 0.02);
        const isTired = Math.random() < fatigueChance;

        while (actionsTaken < maxActions && actionsTaken !== lastActionCount && this.engine.state.status === 'ongoing') {
            lastActionCount = actionsTaken;

            // Якщо "втомився" - шанс пропустити дію
            if (isTired && actionsTaken > 3 && Math.random() < 0.3) {
                break;
            }

            const actionSucceeded = await this.performBestAction();
            if (actionSucceeded) {
                actionsTaken++;
                await this.thinkingDelay('action');
            }
        }

        await this.thinkingDelay('end');
        if (this.engine.state.status === 'ongoing') this.engine.nextTurn();
    }

    /**
     * Оновлює стратегію на основі поточної ситуації
     */
    updateStrategy() {
        const state = this.engine.state;
        const myTerrs = state.territories.filter(t => t.owner === 'ai');
        const playerTerrs = state.territories.filter(t => t.owner === 'player');
        const neutralTerrs = state.territories.filter(t => t.owner === 'neutral');

        const myStrength = myTerrs.reduce((sum, t) => sum + t.units, 0);
        const playerStrength = playerTerrs.reduce((sum, t) => sum + t.units, 0);

        // Визначаємо стратегію
        if (neutralTerrs.length > 3 && this.memory.totalTurns < 5) {
            // Початок гри - експансія
            this.currentStrategy = 'expand';
        } else if (myStrength < playerStrength * 0.7) {
            // Ми слабші - оборона
            this.currentStrategy = 'defend';
        } else if (myStrength > playerStrength * 1.3 || Math.random() < this.personality.aggression * 0.5) {
            // Ми сильніші або агресивний AI - атака
            this.currentStrategy = 'aggress';
        } else {
            // Збалансована ситуація - випадковий вибір з нахилом
            const roll = Math.random();
            if (roll < 0.4) this.currentStrategy = 'expand';
            else if (roll < 0.7) this.currentStrategy = 'defend';
            else this.currentStrategy = 'aggress';
        }
    }

    /**
     * Розміщення підсилень з урахуванням стратегії та "помилок"
     */
    async handleReinforcements() {
        while (this.engine.state.reinforcementsAvailable > 0) {
            const myTerrs = this.engine.state.territories.filter(t => t.owner === 'ai');
            if (myTerrs.length === 0) break;

            const scoredTerrs = myTerrs.map(t => {
                const neighbors = t.neighbors.map(id => this.engine.state.territories.find(n => n.id === id));
                const playerNeighbors = neighbors.filter(n => n.owner === 'player');
                const neutralNeighbors = neighbors.filter(n => n.owner === 'neutral');

                let score = 0;

                // Базовий скор залежить від стратегії
                if (this.currentStrategy === 'defend') {
                    // Оборона: пріоритет на кордони з гравцем
                    if (playerNeighbors.length > 0) {
                        const threat = playerNeighbors.reduce((sum, n) => sum + n.units, 0);
                        score = 50 + threat * 2 - t.units;
                        // Особливий пріоритет якщо гравець атакував звідси
                        if (this.memory.playerLastAttackedFrom &&
                            playerNeighbors.some(n => n.id === this.memory.playerLastAttackedFrom)) {
                            score += 30;
                        }
                    }
                } else if (this.currentStrategy === 'aggress') {
                    // Агресія: підсилюємо для атаки на гравця
                    if (playerNeighbors.length > 0) {
                        const weakest = Math.min(...playerNeighbors.map(n => n.units));
                        score = 40 + (t.units - weakest) * 3;
                    }
                } else {
                    // Експансія: пріоритет на нейтральні
                    if (neutralNeighbors.length > 0) {
                        score = 30 + neutralNeighbors.length * 10;
                    } else if (playerNeighbors.length > 0) {
                        score = 20;
                    }
                }

                // Критичне підсилення слабких кордонів
                if (t.units < 3 && playerNeighbors.length > 0) {
                    score += 40;
                }

                return { id: t.id, score, territory: t };
            }).sort((a, b) => b.score - a.score);

            // Симуляція "помилки" - іноді вибираємо не найкращий варіант
            let targetIndex = 0;
            if (Math.random() > this.personality.focusLevel && scoredTerrs.length > 1) {
                // "Пропустили" найкращий варіант
                targetIndex = Math.min(Math.floor(Math.random() * 3), scoredTerrs.length - 1);
            } else {
                // Невелика варіативність навіть при "фокусі"
                const topCount = Math.min(2, scoredTerrs.length);
                targetIndex = Math.floor(Math.random() * topCount);
            }

            const targetId = scoredTerrs[targetIndex].id;
            this.engine.selectTerritory(targetId);
            await this.thinkingDelay('reinforce');
        }
    }

    /**
     * Виконує найкращу дію (атака або переміщення)
     */
    async performBestAction() {
        const myTerrs = this.engine.state.territories.filter(t => t.owner === 'ai');
        const attacks = [];
        const moves = [];

        for (const source of myTerrs) {
            const neighbors = source.neighbors.map(id => this.engine.state.territories.find(n => n.id === id));

            if (source.units > 1) {
                neighbors.filter(n => n.owner !== 'ai').forEach(target => {
                    let score = 0;
                    const advantage = source.units - target.units;

                    if (target.owner === 'player') {
                        // Атака на гравця
                        if (this.currentStrategy === 'aggress') {
                            // Агресивна стратегія - атакуємо частіше
                            if (advantage > 0) {
                                score = 50 + advantage * 4;
                            } else if (advantage > -2 && Math.random() < this.personality.riskTolerance) {
                                score = 20; // Ризикована атака
                            }
                        } else if (this.currentStrategy === 'defend') {
                            // Оборонна стратегія - атакуємо тільки з великою перевагою
                            if (advantage >= 3) {
                                score = 30 + advantage * 2;
                            }
                        } else {
                            // Стандартна логіка
                            if (advantage > 0) {
                                score = 35 + advantage * 3;
                            } else if (source.units > 5 && Math.random() < this.personality.riskTolerance * 0.5) {
                                score = 15;
                            }
                        }
                    } else if (target.owner === 'neutral') {
                        // Атака на нейтральних
                        if (this.currentStrategy === 'expand') {
                            score = 40 + advantage * 2;
                        } else {
                            score = 20 + advantage;
                        }
                    }

                    if (score > 0) attacks.push({ source, target, score });
                });
            }

            // Переміщення військ з тилу на фронт
            if (source.units > 3) {
                const isInternal = neighbors.every(n => n.owner === 'ai');
                if (isInternal) {
                    neighbors.forEach(target => {
                        const targetNeighbors = target.neighbors.map(id => this.engine.state.territories.find(n => n.id === id));
                        const targetHasPlayerNeighbor = targetNeighbors.some(n => n.owner === 'player');
                        const targetHasNeutralNeighbor = targetNeighbors.some(n => n.owner === 'neutral');

                        let mScore = 0;
                        if (targetHasPlayerNeighbor) {
                            mScore = this.currentStrategy === 'defend' ? 30 : 20;
                        } else if (targetHasNeutralNeighbor && this.currentStrategy === 'expand') {
                            mScore = 25;
                        } else {
                            mScore = 1;
                        }
                        moves.push({ source, target, score: mScore });
                    });
                }
            }
        }

        // Сортуємо атаки
        attacks.sort((a, b) => b.score - a.score);

        // Симуляція "помилки" - шанс пропустити найкращу атаку
        if (attacks.length > 0) {
            let attackIndex = 0;
            if (Math.random() > this.personality.focusLevel && attacks.length > 1) {
                attackIndex = Math.min(Math.floor(Math.random() * 3), attacks.length - 1);
            }

            const chosen = attacks[attackIndex];

            // Ще один шанс "передумати" для оборонного AI
            if (this.currentStrategy === 'defend' && Math.random() < 0.2) {
                // Пропускаємо атаку
            } else {
                this.engine.selectTerritory(chosen.source.id);
                this.engine.selectTerritory(chosen.target.id);
                return true;
            }
        }

        // Переміщення
        moves.sort((a, b) => b.score - a.score);
        if (moves.length > 0) {
            const best = moves[0];
            // Варіативність у кількості переміщених військ
            const movePercent = 0.5 + Math.random() * 0.4; // 50-90%
            const toMove = Math.floor(best.source.units * movePercent);
            if (toMove > 0 && toMove < best.source.units) {
                this.engine.move(best.source, best.target, toMove);
                return true;
            }
        }

        return false;
    }

    /**
     * Людські затримки "роздумів"
     */
    thinkingDelay(type) {
        let base, variance;

        switch (type) {
            case 'start':
                base = 800; variance = 400;
                break;
            case 'action':
                base = 400; variance = 300;
                break;
            case 'reinforce':
                base = 150; variance = 100;
                break;
            case 'end':
                base = 300; variance = 200;
                break;
            default:
                base = 300; variance = 100;
        }

        // Терплячий AI думає довше
        if (this.personality.patience) {
            base *= 1.3;
        }

        const delay = base + Math.random() * variance;
        return new Promise(r => setTimeout(r, delay));
    }

    delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// --- RENDERER ---
class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas; this.ctx = ctx;
        this.camera = { x: 0, y: 0, scale: 1 };
        this.time = 0;
    }
    updateCamera() {
        this.camera.x = this.canvas.width / 2;
        this.camera.y = this.canvas.height / 2;
    }
    draw(state) {
        this.time += 0.05;
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);

        // Draw Territories
        state.territories.forEach(t => this.drawHex(t, state.selectedId === t.id));

        // Draw Animations
        this.drawAnimations(state);

        this.ctx.restore();
        this.updateDOM(state);
    }
    drawHex(t, isSelected) {
        const size = CONFIG.MAP.HEX_SIZE;
        const pulse = isSelected ? Math.sin(this.time * 2) * 2 : 0;
        // Small constant added to eliminate sub-pixel gaps in rendering
        const fillSize = size + 0.7; // Slightly larger for fill
        const currentSize = size + pulse;

        // Draw fill (slightly larger to eliminate gaps)
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (Math.PI / 6);
            const px = t.x + fillSize * Math.cos(angle);
            const py = t.y + fillSize * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();

        // Base Color
        let baseColor = CONFIG.COLORS.NEUTRAL;
        if (t.owner === 'player') baseColor = CONFIG.COLORS.PLAYER;
        if (t.owner === 'ai') baseColor = CONFIG.COLORS.AI;

        this.ctx.fillStyle = baseColor;
        this.ctx.globalAlpha = 0.8 + (t.flash * 0.2);
        this.ctx.fill();

        // Flash Effect logic
        if (t.flash > 0) {
            this.ctx.fillStyle = "#fff";
            this.ctx.globalAlpha = t.flash * 0.5;
            this.ctx.fill();
            t.flash -= 0.05;
            if (t.flash < 0) t.flash = 0;
        }

        // Border ONLY for selected territory
        if (isSelected) {
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + (Math.PI / 6);
                const px = t.x + currentSize * Math.cos(angle);
                const py = t.y + currentSize * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();
            this.ctx.strokeStyle = CONFIG.COLORS.SELECTION;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 1;
            this.ctx.stroke();
        }

        // Reset alpha
        this.ctx.globalAlpha = 1;

        // Coordinates (q, r) - top part of hexagon
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowColor = 'rgba(255,255,255,0.5)';
        this.ctx.fillText(`${t.q}`, t.x, t.y - 12);
        this.ctx.fillText(`${t.r}`, t.x, t.y);

        // Unit count - bottom part of hexagon
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(t.units, t.x, t.y + 14);
        this.ctx.shadowBlur = 0;
    }

    drawAnimations(state) {
        state.animations = state.animations.filter(anim => anim.life > 0);
        state.animations.forEach(anim => {
            const progress = 1 - (anim.life / anim.duration);
            if (anim.type === 'attack') {
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 4 * (1 - progress);
                this.ctx.setLineDash([5, 5]);
                this.ctx.moveTo(anim.from.x, anim.from.y);
                this.ctx.lineTo(anim.to.x, anim.to.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);

                // Particle at target
                this.ctx.beginPath();
                this.ctx.arc(anim.to.x, anim.to.y, progress * 30, 0, Math.PI * 2);
                this.ctx.fillStyle = "rgba(255, 255, 255, " + (1 - progress) + ")";
                this.ctx.fill();
            } else if (anim.type === 'move') {
                const curX = anim.from.x + (anim.to.x - anim.from.x) * progress;
                const curY = anim.from.y + (anim.to.y - anim.from.y) * progress;
                this.ctx.beginPath();
                this.ctx.arc(curX, curY, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = CONFIG.COLORS.PLAYER;
                this.ctx.fill();
            }
            anim.life--;
        });
    }

    updateDOM(state) {
        document.getElementById('turn-count').innerText = state.turn;
        document.getElementById('player-territories').innerText = state.territories.filter(t => t.owner === 'player').length;
        document.getElementById('ai-territories').innerText = state.territories.filter(t => t.owner === 'ai').length;
        document.getElementById('reinforcement-count').innerText = state.reinforcementsAvailable;
        document.getElementById('reinforcement-panel').style.opacity = state.phase === 'reinforce' ? '1' : '0.3';
        document.getElementById('game-log').innerHTML = state.logs.map(log => `<div class="log-entry">${log}</div>`).join('');

        // Handle Game Over Screen
        const gameOverEl = document.getElementById('game-over');
        if (state.status !== 'ongoing') {
            gameOverEl.classList.remove('hidden');
            const title = document.getElementById('game-over-title');
            const msg = document.getElementById('game-over-message');
            if (state.status === 'won') {
                title.innerText = "ПЕРЕМОГА!";
                title.style.background = "linear-gradient(135deg, #00d2ff, #fff)";
                title.style.webkitBackgroundClip = "text";
                title.style.webkitTextFillColor = "transparent";
                msg.innerText = "Ви захопили всі території!";
            } else {
                title.innerText = "ПОРАЗКА";
                title.style.background = "linear-gradient(135deg, #ff416c, #fff)";
                title.style.webkitBackgroundClip = "text";
                title.style.webkitTextFillColor = "transparent";
                msg.innerText = "ШІ здобув повний контроль.";
            }
        } else {
            gameOverEl.classList.add('hidden');
        }
    }
}

// --- APP ---
class App {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.engine = new GameEngine();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.ai = new SimpleAI(this.engine);
        this.aiPlaying = false;
        this.gameState = 'menu'; // 'menu' or 'active'

        // Troop dialog state
        this.pendingMove = null; // { sourceId, targetId }

        this.init();
    }
    init() {
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        document.getElementById('btn-start-game').onclick = () => this.startGame();
        document.getElementById('btn-restart').onclick = () => this.startGame();

        document.getElementById('btn-end-turn').onclick = () => {
            if (this.engine.state.currentPlayer === 'player' && this.engine.state.status === 'ongoing') this.engine.nextTurn();
        };
        document.getElementById('btn-new-game').onclick = () => this.showMenu();

        // Troop dialog event listeners
        const slider = document.getElementById('troop-slider');
        slider.addEventListener('input', (e) => {
            document.getElementById('slider-display').textContent = e.target.value;
        });

        document.getElementById('btn-confirm-move').onclick = () => this.confirmMove();
        document.getElementById('btn-cancel-move').onclick = () => this.hideTroopDialog();

        this.loop();
    }
    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.renderer.updateCamera();
    }
    handleClick(e) {
        if (this.engine.state.currentPlayer !== 'player') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) - this.renderer.camera.x;
        const y = (e.clientY - rect.top) - this.renderer.camera.y;

        // Accurate distance check for hexes
        const terr = this.engine.state.territories.find(t => {
            const dx = Math.abs(t.x - x);
            const dy = Math.abs(t.y - y);
            const size = CONFIG.MAP.HEX_SIZE;
            // Pointy-top hex distance check
            return dy <= size * 0.9 && (dx <= size * Math.sqrt(3) / 2 * 0.9) && (dy + dy + dx / (Math.sqrt(3) / 2) <= size * 2 * 0.9);
        });

        if (!terr) return;

        // Check if this is a move action that should show dialog
        if (this.engine.state.phase === 'attack' && this.engine.state.selectedId !== null) {
            const source = this.engine.state.territories.find(t => t.id === this.engine.state.selectedId);
            if (source && source.owner === 'player' && terr.owner === 'player' && source.neighbors.includes(terr.id)) {
                // Show troop selection dialog instead of auto-moving
                this.showTroopDialog(source.id, terr.id);
                return;
            }
        }

        // Otherwise, handle normally
        this.engine.selectTerritory(terr.id);
    }

    /**
     * Show troop selection dialog for moving troops between territories
     * @param {number} sourceId - Source territory ID
     * @param {number} targetId - Target territory ID
     */
    showTroopDialog(sourceId, targetId) {
        const source = this.engine.state.territories.find(t => t.id === sourceId);
        const target = this.engine.state.territories.find(t => t.id === targetId);

        if (!source || !target) return;

        const maxTroops = source.units - 1; // Must leave at least 1
        if (maxTroops <= 0) return;

        // Store pending move
        this.pendingMove = { sourceId, targetId };

        // Update dialog UI
        document.getElementById('dialog-source').textContent = `Терит. ${sourceId}`;
        document.getElementById('dialog-target').textContent = `Терит. ${targetId}`;
        document.getElementById('dialog-available').textContent = maxTroops;

        const slider = document.getElementById('troop-slider');
        slider.min = 1;
        slider.max = maxTroops;
        slider.value = Math.min(maxTroops, parseInt(slider.value) || 1);
        document.getElementById('slider-display').textContent = slider.value;

        // Show dialog
        document.getElementById('troop-dialog').classList.remove('hidden');
    }

    /**
     * Hide the troop selection dialog
     */
    hideTroopDialog() {
        document.getElementById('troop-dialog').classList.add('hidden');
        this.pendingMove = null;
        this.engine.state.selectedId = null; // Deselect territory
    }

    /**
     * Confirm and execute the troop movement
     */
    confirmMove() {
        if (!this.pendingMove) return;

        const { sourceId, targetId } = this.pendingMove;
        const source = this.engine.state.territories.find(t => t.id === sourceId);
        const target = this.engine.state.territories.find(t => t.id === targetId);
        const troopCount = parseInt(document.getElementById('troop-slider').value);

        if (source && target && troopCount > 0) {
            this.engine.move(source, target, troopCount);
        }

        this.hideTroopDialog();
    }

    startGame() {
        this.gameState = 'active';
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        this.engine = new GameEngine(); // Reset/New Engine on start
        this.ai = new SimpleAI(this.engine);
        this.aiPlaying = false;
    }

    showMenu() {
        this.gameState = 'menu';
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('game-over').classList.add('hidden');
    }

    loop() {
        if (this.gameState === 'active') {
            if (this.engine.state.currentPlayer === 'ai' && !this.aiPlaying && this.engine.state.status === 'ongoing') {
                this.aiPlaying = true;
                this.ai.playTurn().then(() => this.aiPlaying = false);
            }
            this.renderer.draw(this.engine.state);
        }
        requestAnimationFrame(() => this.loop());
    }
}
window.onload = () => new App();
