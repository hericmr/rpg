import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';

export const Game: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const initGame = () => {
      if (!gameRef.current) {
        try {
          gameRef.current = new Phaser.Game({
            ...gameConfig,
            parent: 'game-container'
          });
        } catch (error) {
          console.error('Error initializing game:', error);
        }
      }
    };

    // Initialize game after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(initGame, 100);

    return () => {
      clearTimeout(timeoutId);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const gameboyStyle = {
    position: 'relative' as const,
    background: `url(${process.env.PUBLIC_URL}/assets/gameboy.png) no-repeat center center`,
    backgroundSize: 'contain',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  return (
    <div className="gameboy-frame" style={gameboyStyle}>
      <div id="game-container" />
    </div>
  );
}; 