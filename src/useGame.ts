/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  PLAYER_SPEED, 
  PLAYER_JUMP_POWER, 
  ENEMY_SPEED_NORMAL,
  PLATFORM_HEIGHT,
  COLORS,
  Player,
  Enemy,
  Platform,
  GameObject
} from './constants';

export function useGame() {
  const [gameState, setGameState] = useState({
    score: 0,
    lives: 3,
    level: 1,
    isGameOver: false,
    highScore: 0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(null);
  
  // Game State Refs (to avoid re-renders during high-frequency loop)
  const playerRef = useRef<Player>({
    id: 'player',
    x: CANVAS_WIDTH / 2 - 20,
    y: CANVAS_HEIGHT - 100,
    width: 32,
    height: 48,
    vx: 0,
    vy: 0,
    type: 'PLAYER',
    lives: 3,
    score: 0,
    isJumping: false,
    facing: 'RIGHT',
    immuneUntil: 0
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const powRef = useRef({ x: CANVAS_WIDTH / 2 - 40, y: 450, width: 80, height: 48, active: true });
  const keysRef = useRef<Record<string, boolean>>({});

  // Level Logic
  useEffect(() => {
    const newLevel = Math.floor(gameState.score / 600) + 1;
    if (newLevel !== gameState.level) {
      setGameState(prev => ({ ...prev, level: newLevel }));
    }
  }, [gameState.score, gameState.level]);

  // Initialize Platforms
  useEffect(() => {
    const platforms: Platform[] = [
      // Ground
      { x: 0, y: CANVAS_HEIGHT - PLATFORM_HEIGHT, width: CANVAS_WIDTH, height: PLATFORM_HEIGHT, isSolid: true },
      // Bottom L/R
      { x: 0, y: CANVAS_HEIGHT - 150, width: 250, height: PLATFORM_HEIGHT, isSolid: true },
      { x: CANVAS_WIDTH - 250, y: CANVAS_HEIGHT - 150, width: 250, height: PLATFORM_HEIGHT, isSolid: true },
      // Middle
      { x: CANVAS_WIDTH / 2 - 150, y: CANVAS_HEIGHT - 300, width: 300, height: PLATFORM_HEIGHT, isSolid: true },
      // Top L/R
      { x: 0, y: CANVAS_HEIGHT - 450, width: 200, height: PLATFORM_HEIGHT, isSolid: true },
      { x: CANVAS_WIDTH - 200, y: CANVAS_HEIGHT - 450, width: 200, height: PLATFORM_HEIGHT, isSolid: true },
    ];
    platformsRef.current = platforms;
  }, []);

  const spawnEnemy = useCallback(() => {
    const side = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
    const x = side === 'LEFT' ? 0 : CANVAS_WIDTH - 30;
    const y = 80;
    const newEnemy: Enemy = {
      id: Math.random().toString(),
      x,
      y,
      width: 32,
      height: 32,
      vx: side === 'LEFT' ? ENEMY_SPEED_NORMAL : -ENEMY_SPEED_NORMAL,
      vy: 0,
      type: 'ENEMY',
      state: 'NORMAL',
      speed: ENEMY_SPEED_NORMAL
    };
    enemiesRef.current.push(newEnemy);
  }, []);

  const resetGame = useCallback(() => {
    playerRef.current = {
      ...playerRef.current,
      x: CANVAS_WIDTH / 2 - 20,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      lives: 3,
      score: 0,
      isJumping: false,
      immuneUntil: 0
    };
    enemiesRef.current = [];
    setGameState(prev => ({ ...prev, score: 0, lives: 3, level: 1, isGameOver: false }));
  }, []);

  const update = useCallback((time: number) => {
    const player = playerRef.current;
    const enemies = enemiesRef.current;
    const platforms = platformsRef.current;
    const keys = keysRef.current;

    if (gameState.isGameOver) return;

    // Player Movement
    if (keys['ArrowLeft'] || keys['a']) {
      player.vx = -PLAYER_SPEED;
      player.facing = 'LEFT';
    } else if (keys['ArrowRight'] || keys['d']) {
      player.vx = PLAYER_SPEED;
      player.facing = 'RIGHT';
    } else {
      player.vx *= 0.8; // Friction
    }

    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && !player.isJumping) {
      player.vy = PLAYER_JUMP_POWER;
      player.isJumping = true;
    }

    // Gravity
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Platform Collisions (Player)
    let onGround = false;
    platforms.forEach(p => {
      // Landing on top
      if (player.vy > 0 && 
          player.x + player.width > p.x && 
          player.x < p.x + p.width &&
          player.y + player.height > p.y &&
          player.y + player.height < p.y + p.height + player.vy) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.isJumping = false;
        onGround = true;
      }

      // Hitting from below
      if (player.vy < 0 &&
          player.x + player.width > p.x &&
          player.x < p.x + p.width &&
          player.y < p.y + p.height &&
          player.y > p.y + p.height + player.vy) {
        player.y = p.y + p.height;
        player.vy = 0;
        
        // Flip enemies on this platform
        enemies.forEach(e => {
          if (e.y + e.height === p.y && 
              e.x + e.width > player.x - 40 && 
              e.x < player.x + player.width + 40) {
            if (e.state === 'NORMAL') {
              e.state = 'FLIPPED';
              e.vx = 0;
              e.flipTimeout = time + (5000 + Math.random() * 2000);
            }
          }
        });
      }
    });

    // POW Block Collision
    const pow = powRef.current;
    if (pow.active &&
        player.vy < 0 && 
        player.x + player.width > pow.x && 
        player.x < pow.x + pow.width &&
        player.y < pow.y + pow.height + 5 &&
        player.y > pow.y + pow.height + player.vy - 5) {
      player.y = pow.y + pow.height;
      player.vy = 0;
      
      // Shake effect
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.transform = 'translateY(10px)';
        setTimeout(() => canvas.style.transform = 'translateY(0)', 100);
      }

      // Flip ALL enemies on platforms
      enemies.forEach(e => {
        if (e.state === 'NORMAL') {
          e.state = 'FLIPPED';
          e.vx = 0;
          e.flipTimeout = time + 6000;
        }
      });
      pow.y -= 8;
      setTimeout(() => pow.y += 8, 100);
    }

    // Screen Wrap
    if (player.x + player.width < 0) player.x = CANVAS_WIDTH;
    if (player.x > CANVAS_WIDTH) player.x = -player.width;

    // Enemies Logic
    enemies.forEach((e, index) => {
      e.vy += GRAVITY;
      e.x += e.vx;
      e.y += e.vy;

      // Enemy Screen Wrap
      if (e.x + e.width < 0) e.x = CANVAS_WIDTH;
      if (e.x > CANVAS_WIDTH) e.x = -e.width;

      // Platform collisions
      platforms.forEach(p => {
        if (e.vy > 0 && 
            e.x + e.width > p.x && 
            e.x < p.x + p.width &&
            e.y + e.height > p.y &&
            e.y + e.height < p.y + p.height + e.vy) {
          e.y = p.y - e.height;
          e.vy = 0;
          
          // Randomly change direction at platform edges or just randomly
          if (Math.random() < 0.005) e.vx *= -1;
        }
      });

      // Flip Timeout
      if (e.state === 'FLIPPED' && time > (e.flipTimeout || 0)) {
        e.state = 'NORMAL';
        e.vx = (e.x < CANVAS_WIDTH / 2) ? e.speed : -e.speed;
        e.speed *= 1.1; // Gets slightly faster every time it recovers
      }

      // Interaction with Player
      const dist = Math.sqrt(Math.pow(player.x - e.x, 2) + Math.pow(player.y - e.y, 2));
      if (dist < 30) {
        if (e.state === 'FLIPPED') {
          // Kick enemy
          enemies.splice(index, 1);
          setGameState(prev => {
            const newScore = prev.score + 100;
            return {
              ...prev,
              score: newScore,
              highScore: Math.max(prev.highScore, newScore)
            };
          });
        } else if (time > player.immuneUntil) {
          // Player hit
          player.lives -= 1;
          player.immuneUntil = time + 2000;
          player.x = CANVAS_WIDTH / 2;
          player.y = 80;
          setGameState(prev => ({ ...prev, lives: player.lives }));
          if (player.lives <= 0) {
            setGameState(prev => ({ ...prev, isGameOver: true }));
          }
        }
      }
    });

    // Spawn more enemies based on score/level
    if (enemies.length < 2 + Math.floor(gameState.score / 500) && Math.random() < 0.01) {
      spawnEnemy();
    }
  }, [gameState.isGameOver, gameState.score, spawnEnemy]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const player = playerRef.current;
    
    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid (Subtle arcade look)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Draw Platforms
    platformsRef.current.forEach(p => {
      // Platform Body (Blue 700ish)
      ctx.fillStyle = COLORS.PLATFORM;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      
      // Top Border (Blue 400ish highlight)
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(p.x, p.y, p.width, 3);
      
      // Bottom Border (Blue 900ish shadow)
      ctx.fillStyle = COLORS.PLATFORM_DARK;
      ctx.fillRect(p.x, p.y + p.height - 4, p.width, 4);

      // Brick-like detail
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for(let x = p.x + 32; x < p.x + p.width; x += 32) {
        ctx.fillRect(x, p.y, 2, p.height);
      }
    });

    // Draw Pipes
    const drawPipe = (x: number, y: number, isRight: boolean) => {
      const gradient = ctx.createLinearGradient(x, y, x + 80, y);
      gradient.addColorStop(0, COLORS.PIPE_GRADIENT[0]);
      gradient.addColorStop(0.5, COLORS.PIPE_GRADIENT[1]);
      gradient.addColorStop(1, COLORS.PIPE_GRADIENT[2]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, 80, 60);
      
      // Secondary cap
      ctx.fillStyle = '#064e3b'; // green-950
      if (y < 100) {
        ctx.fillRect(x, y + 52, 80, 8); // Bottom lip for top pipes
      } else {
        ctx.fillRect(x, y, 80, 8); // Top lip for bottom pipes
      }
    };

    drawPipe(0, 0, false); // Top Left
    drawPipe(CANVAS_WIDTH - 80, 0, true); // Top Right
    drawPipe(0, CANVAS_HEIGHT - 60, false); // Bottom Left
    drawPipe(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 60, true); // Bottom Right

    // Draw POW Block
    const pow = powRef.current;
    if (pow.active) {
      ctx.fillStyle = '#ef4444'; // Red-600
      ctx.fillRect(pow.x, pow.y, pow.width, pow.height);
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeRect(pow.x + 4, pow.y + 4, pow.width - 8, pow.height - 8);
      
      // Ring (ring-2 ring-red-400)
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(pow.x - 2, pow.y - 2, pow.width + 4, pow.height + 4);

      ctx.fillStyle = '#fff';
      ctx.font = 'black 24px "Courier New"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('POW', pow.x + pow.width / 2, pow.y + pow.height / 2);
    }

    // Draw Player
    if (!(time < player.immuneUntil && Math.floor(time / 100) % 2 === 0)) {
      ctx.fillStyle = COLORS.MARIO;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      // Cap/Eyes
      ctx.fillStyle = '#000';
      const eyeX = player.facing === 'RIGHT' ? player.x + 20 : player.x + 5;
      ctx.fillRect(eyeX, player.y + 10, 5, 5);
    }

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      ctx.fillStyle = e.state === 'FLIPPED' ? COLORS.FLIPPED : COLORS.SHELLCREEPER;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      // Direction indicator
      ctx.fillStyle = '#000';
      if (e.state === 'NORMAL') {
        const eyeX = e.vx > 0 ? e.x + 20 : e.x + 5;
        ctx.fillRect(eyeX, e.y + 10, 5, 5);
      }
    });

    // HUD
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '24px "Courier New"';
    ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
    ctx.fillText(`LIVES: ${gameState.lives}`, 20, 60);

    if (gameState.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = '48px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '24px "Courier New"';
      ctx.fillText('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
  }, [gameState.score, gameState.lives, gameState.isGameOver]);

  const loop = useCallback((time: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      update(time);
      draw(ctx, time);
    }
    gameLoopRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [loop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key.toLowerCase() === 'r' && gameState.isGameOver) {
        resetGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isGameOver, resetGame]);

  return { canvasRef, gameState, resetGame };
}
