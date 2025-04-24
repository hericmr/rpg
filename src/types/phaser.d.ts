import 'phaser';

declare module 'phaser' {
  namespace Types {
    namespace Input {
      namespace Keyboard {
        interface CursorKeys {
          up: Key;
          down: Key;
          left: Key;
          right: Key;
          space: Key;
          shift: Key;
        }
      }
    }
  }
} 