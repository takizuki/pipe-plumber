/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Game Constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 0.5;
export const PLAYER_SPEED = 5;
export const PLAYER_JUMP_POWER = -14;
export const ENEMY_SPEED_NORMAL = 1.8;
export const ENEMY_SPEED_FAST = 3.2;
export const PLATFORM_HEIGHT = 20;

// Colors
export const COLORS = {
  BACKGROUND: '#000000',
  PLATFORM: '#1d4ed8', // blue-700
  PLATFORM_DARK: '#1e3a8a', // blue-900
  MARIO: '#ef4444', // red-500
  SHELLCREEPER: '#22c55e', // green-500
  FLIPPED: '#f97316', // orange-500
  PIPE_GRADIENT: ['#15803d', '#4ade80', '#14532d'], // green-700, green-400, green-900
  POW: '#ef4444', // red-600 (actually using bg-red-600)
  TEXT: '#ffffff',
};

// Types
export type EntityType = 'PLAYER' | 'ENEMY' | 'COIN' | 'POW';
export type EnemyState = 'NORMAL' | 'FLIPPED' | 'KICKED';

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: EntityType;
}

export interface Player extends GameObject {
  type: 'PLAYER';
  lives: number;
  score: number;
  isJumping: boolean;
  facing: 'LEFT' | 'RIGHT';
  immuneUntil: number;
}

export interface Enemy extends GameObject {
  type: 'ENEMY';
  state: EnemyState;
  speed: number;
  flipTimeout?: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isSolid: boolean;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  platforms: Platform[];
  coins: GameObject[];
  isGameOver: boolean;
  isPaused: boolean;
  level: number;
  powUses: number;
}
