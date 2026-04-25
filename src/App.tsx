/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useGame } from './useGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { motion } from 'motion/react';
import { Gamepad2, Info, Trophy, RotateCcw } from 'lucide-react';

export default function App() {
  const { canvasRef, gameState, resetGame } = useGame();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono text-white overflow-hidden select-none">
      <div className="relative flex flex-col w-[1024px] h-[850px] bg-black border-8 border-gray-900 shadow-2xl rounded-sm overflow-hidden">
        
        {/* HUD / Score Bar */}
        <div className="flex justify-between items-center px-12 py-6 border-b-4 border-gray-800 bg-[#050505]">
          <div className="space-y-1">
            <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">1P Score</div>
            <div className="text-3xl font-black tracking-tighter text-white">
              {gameState.score.toString().padStart(8, '0')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-red-500 font-bold uppercase tracking-widest">High Score</div>
            <div className="text-3xl font-black tracking-tighter text-white">
              {gameState.highScore.toString().padStart(8, '0')}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-green-400 font-bold uppercase tracking-widest">Phase</div>
            <div className="text-3xl font-black tracking-tighter text-white">
              {gameState.level.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Game Stage Container */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
          <div className="relative p-8">
            <canvas 
              ref={canvasRef} 
              width={CANVAS_WIDTH} 
              height={CANVAS_HEIGHT}
              className="bg-black shadow-[0_0_100px_rgba(30,58,138,0.2)]"
              style={{
                imageRendering: 'pixelated'
              }}
            />

            {/* CRT Overlay Effects */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
              <div className="absolute inset-8 rounded-lg shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] border border-white/5" />
            </div>

            {/* Game Over Screen */}
            {gameState.isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90"
              >
                <div className="text-center space-y-6">
                  <h2 className="text-7xl font-black text-red-600 italic tracking-tighter animate-pulse">GAME OVER</h2>
                  <div className="space-y-2">
                    <p className="text-xl text-yellow-400 font-bold">FINAL SCORE: {gameState.score}</p>
                    <p className="text-sm text-gray-500">PRESS R TO RESTART</p>
                  </div>
                  <button 
                    onClick={resetGame}
                    className="mt-4 px-10 py-3 bg-blue-700 border-b-4 border-blue-900 text-white font-black hover:bg-blue-600 transition-all uppercase tracking-widest active:translate-y-1 active:border-b-0"
                  >
                    CONTINUE
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="h-16 bg-gray-950 flex items-center justify-between px-12 border-t-2 border-gray-800">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-400 uppercase font-black tracking-widest">Lives:</div>
            <div className="flex space-x-2">
              {Array.from({ length: gameState.lives }).map((_, i) => (
                <div key={i} className="w-5 h-6 bg-red-600 border-2 border-white shadow-sm" title="Life heart" />
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 space-x-4 flex items-center">
            <div className="flex items-center gap-2">
              <span className="w-6 h-4 bg-gray-800 border-b-2 border-black flex items-center justify-center text-[8px] text-white">W</span>
              <span className="text-[10px]">JUMP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-4 bg-gray-800 border-b-2 border-black flex items-center justify-center text-[8px] text-white">AD</span>
              <span className="text-[10px]">MOVE</span>
            </div>
          </div>

          <div className="text-[10px] text-gray-700 tracking-[0.3em] uppercase font-bold">
            Nintendo 1983 - Arcade Style UI
          </div>
        </div>
      </div>
    </div>
  );
}
