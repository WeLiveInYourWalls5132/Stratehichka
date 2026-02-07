/**
 * Simple Heuristic-based AI for Hexagon Strategy
 */
export class SimpleAI {
    constructor(engine) {
        this.engine = engine;
    }

    async playTurn() {
        const state = this.engine.getState();
        if (state.currentPlayer !== 'ai') return;

        this.engine.log("ШІ обдумує хід...");
        await this.delay(1000);

        // 1. Reinforcement Phase
        this.handleReinforcements();
        await this.delay(500);

        // 2. Attack Phase
        this.handleAttacks();
        await this.delay(500);

        // 3. Move/End Phase
        this.engine.nextTurn();
    }

    handleReinforcements() {
        const myTerritories = this.engine.getState().territories.filter(t => t.owner === 'ai');
        if (myTerritories.length === 0) return;

        while (this.engine.state.reinforcementsAvailable > 0) {
            // Priority: Reinforce territories with many enemy neighbors
            const target = myTerritories.sort((a, b) => {
                const aEnemyNeighbors = this.countEnemyNeighbors(a);
                const bEnemyNeighbors = this.countEnemyNeighbors(b);
                return bEnemyNeighbors - aEnemyNeighbors;
            })[0];

            this.engine.selectTerritory(target.id);
        }
    }

    handleAttacks() {
        const myTerritories = this.engine.getState().territories.filter(t => t.owner === 'ai' && t.units > 1);

        for (const source of myTerritories) {
            const neighbors = source.neighbors.map(id => this.engine.state.territories.find(t => t.id === id));

            // Priority 1: Capturing neutral or weak player territories
            const targets = neighbors.filter(n => n.owner !== 'ai')
                .sort((a, b) => a.units - b.units);

            if (targets.length > 0) {
                const target = targets[0];
                // Only attack if we have a decent chance (heuristic: source > target units)
                if (source.units > target.units || Math.random() < 0.3) {
                    this.engine.selectTerritory(source.id);
                    this.engine.selectTerritory(target.id);
                    break; // One attack per turn for now for simplicity
                }
            }
        }
    }

    countEnemyNeighbors(territory) {
        return territory.neighbors.filter(id => {
            const n = this.engine.state.territories.find(t => t.id === id);
            return n.owner !== 'ai';
        }).length;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
