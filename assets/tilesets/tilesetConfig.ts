export interface TilesetConfig {
  name: string;
  path: string;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  margin: number;
  spacing: number;
}

export const TILESETS: Record<string, TilesetConfig> = {
  ROOM_BUILDER: {
    name: 'Room_Builder_free_16x16',
    path: '/assets/tilesets/Room_Builder_free_16x16.png',
    tileWidth: 16,
    tileHeight: 16,
    columns: 16,
    margin: 0,
    spacing: 0
  },
  INTERIORS: {
    name: 'Interiors_free_16x16',
    path: '/assets/tilesets/Interiors_free_16x16.png',
    tileWidth: 16,
    tileHeight: 16,
    columns: 16,
    margin: 0,
    spacing: 0
  }
};

export const MAPS: Record<string, string> = {
  OFFICE: '/assets/maps/mapa_v2.json'
};

export const SPRITES: Record<string, string> = {
  PLAYER: '/assets/sprites/heric2.png',
  LION: '/assets/sprites/lion.png',
  LION_FACE: '/assets/sprites/lion_2.png'
};

export const UI: Record<string, string> = {
  WALL: '/assets/ui/wall.svg',
  FLOOR: '/assets/ui/floor.svg',
  DESK: '/assets/ui/desk.svg',
  CHAIR: '/assets/ui/chair.svg',
  TERMINAL: '/assets/ui/terminal.svg',
  ELEVATOR: '/assets/ui/elevator.svg'
}; 