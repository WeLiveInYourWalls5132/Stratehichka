# UI/UX Specification: Hexagon Strategy Game

## Visual Concept
- **Theme:** Minimalist Flat Design.
- **Background:** Dark charcoal (#2c3e50).
- **Player Colors:**
  - Player: Neon Blue (#00d2ff)
  - AI: Crimson (#ff416c)
  - Neutral: Slate (#bdc3c7)

## User Flows
### 1. Game Start
- User sees the generated map.
- "Reinforcements" indicator shows units to place.

### 2. Attacking
- User clicks their territory (Source).
- User clicks adjacent enemy territory (Target).
- "Attack" button becomes active.
- Combat log shows dice rolls.

### 3. Ending Turn
- "End Turn" button triggers AI sequance.
- Visual delay for AI actions (simulation of thinking).

## Component Breakdown
- **Map View:** Central hex grid.
- **Dashboard:** Top statistics (Turns, Territories Owned).
- **Log Panel:** Side/Bottom scrolling text for game events.
- **Controls:** Floating buttons for actions.
