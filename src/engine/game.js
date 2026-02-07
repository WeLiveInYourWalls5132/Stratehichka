import { MapGenerator } from './map.js';
import { CONFIG } from '../utils/config.js';

/**
 * Core Game Engine - Manages state and rules
 */
export class GameEngine {
    constructor() {
        this.state = {
            turn: 1,
            currentPlayer: 'player',
            phase: 'reinforce', // reinforce, attack, move
            territories: [],
            selectedId: null,
            targetId: null,
            reinforcementsAvailable: 0,
            logs: ["Гра почалася! Гравці займають позиції."]
        };

        this.init();
    }

    init() {
        this.state.territories = MapGenerator.generate();
        this.calculateReinforcements();
    }

    getState() {
        return this.state;
    }

    calculateReinforcements() {
        const count = this.state.territories.filter(t => t.owner === this.state.currentPlayer).length;
        this.state.reinforcementsAvailable = Math.max(
            CONFIG.GAMEPLAY.MIN_REINFORCEMENTS,
            Math.floor(count / CONFIG.GAMEPLAY.REINFORCEMENT_RATE)
        );
    }

    selectTerritory(id) {
        const territory = this.state.territories.find(t => t.id === id);
        if (!territory) return;

        // Log selection for debug
        console.log(`Selected: ${id}, owner: ${territory.owner}, units: ${territory.units}`);

        if (this.state.phase === 'reinforce') {
            if (territory.owner === this.state.currentPlayer && this.state.reinforcementsAvailable > 0) {
                territory.units++;
                this.state.reinforcementsAvailable--;
                if (this.state.reinforcementsAvailable === 0) {
                    this.state.phase = 'attack';
                    this.log("Фаза підкріплення завершена. Час атакувати!");
                }
            }
        } else if (this.state.phase === 'attack' || this.state.phase === 'move') {
            if (this.state.selectedId === null) {
                if (territory.owner === this.state.currentPlayer && territory.units > 1) {
                    this.state.selectedId = id;
                }
            } else if (this.state.selectedId === id) {
                this.state.selectedId = null; // Deselect
            } else {
                // Potential target
                const source = this.state.territories.find(t => t.id === this.state.selectedId);
                if (source.neighbors.includes(id)) {
                    this.handleAction(source, territory);
                } else {
                    this.state.selectedId = null; // Cancel selection if not neighbor
                }
            }
        }
    }

    handleAction(source, target) {
        if (target.owner !== this.state.currentPlayer) {
            this.attack(source, target);
        } else {
            this.move(source, target);
        }
        this.state.selectedId = null;
    }

    attack(source, target) {
        this.log(`Атака з території ${source.id} на ${target.id}`);
        // Simple combat for now: winner is who has more units (placeholder for dice)
        // MVP DICE LOGIC
        const attackRoll = Math.floor(Math.random() * 6) + 1;
        const defenseRoll = Math.floor(Math.random() * 6) + 1;

        if (attackRoll > defenseRoll) {
            target.units--;
            if (target.units <= 0) {
                target.owner = source.owner;
                target.units = source.units - 1;
                source.units = 1;
                this.log(`Перемога! Територія захоплена.`);
            }
        } else {
            source.units--;
            this.log(`Атака відбита. Ви втратили 1 юніт.`);
        }
    }

    move(source, target) {
        const toMove = source.units - 1;
        if (toMove > 0) {
            target.units += toMove;
            source.units = 1;
            this.log(`Переміщено ${toMove} військ.`);
            this.state.phase = 'move'; // Transition to move phase or end
        }
    }

    nextTurn() {
        this.state.currentPlayer = this.state.currentPlayer === 'player' ? 'ai' : 'player';
        this.state.turn++;
        this.state.phase = 'reinforce';
        this.state.selectedId = null;
        this.calculateReinforcements();
        this.log(`Хід ${this.state.turn}: Зараз черга ${this.state.currentPlayer === 'player' ? 'Гравця' : 'ШІ'}`);
    }

    log(msg) {
        this.state.logs.unshift(msg);
        if (this.state.logs.length > 10) this.state.logs.pop();
    }
}
