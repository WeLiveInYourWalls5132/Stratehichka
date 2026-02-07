# Game Design Document: Hexagon Strategy Case (MVP)

## 1. Overview
A turn-based strategy game where the player competes against an AI to control a map of hexagonal territories. Inspired by Risk and Civilization.

## 2. Core Gameplay Mechanics
- **Map:** 15-25 hexagonal territories.
- **Territories:** Each territory has an owner (Player, AI, or Neutral) and a number of units (armies).
- **Turns:** Turn-based gameplay. 
    - Player Turn: Reinforce, Attack, Move, End Turn.
    - AI Turn: Automated actions based on simple logic.
- **Reinforcement:** At the start of each turn, the owner receives units based on the number of territories held (e.g., 1 unit per 3 territories, min 3).
- **Attack:** 
    - Selected territory must have > 1 unit.
    - Can only attack adjacent territories.
    - Dice-based combat: 
        - Attacker rolls 1-3 dice (depending on army size).
        - Defender rolls 1-2 dice (depending on army size).
        - Highest rolls compared; defender loses unit if attacker roll is higher, otherwise attacker loses. (Classic Risk mechanic).
- **Movement:** Move units between adjacent friendly territories (1 move per turn).
- **Winning Condition:** Capture 100% of territories or reach a target number (e.g., 15 territories).

## 3. Visual Style
- **UI:** Minimalist, clean.
- **Colors:** 
    - Player: Blue (#3498db)
    - AI: Red (#e74c3c)
    - Neutral: Gray (#95a5a6)
- **Indicators:** Hexagons show the number of units in the center.

## 4. AI Behavior
- **Priority:**
    1. Capture neutral territories.
    2. Attack weak player territories.
    3. Reinforce borders.
- **Aggression:** High if it has > 2x units of neighbor.

## 5. Metadata
- **Platform:** Web Browser (Mobile responsive).
- **Save State:** LocalStorage.
