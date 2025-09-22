export interface MapSensor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameMap {
  type: 'map';
  width: number;
  height: number;
  gridSize: number;
  scene: string;
  collisions: string[];
  sensors: MapSensor[];
}

export interface GameScene {
  type: 'scene';
  name: string;
  background?: string;
  map?: GameMap;
}
